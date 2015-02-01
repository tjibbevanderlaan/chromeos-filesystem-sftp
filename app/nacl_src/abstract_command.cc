#include <sys/select.h>

#include "abstract_command.h"

AbstractCommand::AbstractCommand(LIBSSH2_SESSION *session,
                                 LIBSSH2_SFTP *sftp_session,
                                 const int server_sock,
                                 SftpEventListener *listener,
                                 const int request_id)
  : session_(session),
    sftp_session_(sftp_session),
    server_sock_(server_sock),
    listener_(listener),
    request_id_(request_id)
{
}

AbstractCommand::~AbstractCommand()
{
}

LIBSSH2_SESSION* AbstractCommand::GetSession()
{
  return session_;
}

LIBSSH2_SFTP* AbstractCommand::GetSftpSession()
{
  return sftp_session_;
}

int AbstractCommand::GetServerSock()
{
  return server_sock_;
}

SftpEventListener* AbstractCommand::GetListener()
{
  return listener_;
}

int AbstractCommand::GetRequestID()
{
  return request_id_;
}

int AbstractCommand::WaitSocket(int socket_fd, LIBSSH2_SESSION *session)
{
  struct timeval timeout;
  int rc;
  fd_set fd;
  fd_set *writefd = NULL;
  fd_set *readfd = NULL;
  int dir;
  timeout.tv_sec = 10;
  timeout.tv_usec = 0;
  FD_ZERO(&fd);
  FD_SET(socket_fd, &fd);
  dir = libssh2_session_block_directions(session);
  if (dir & LIBSSH2_SESSION_BLOCK_INBOUND) {
    readfd = &fd;
  }
  if (dir & LIBSSH2_SESSION_BLOCK_OUTBOUND) {
    writefd = &fd;
  }
  rc = select(socket_fd + 1, readfd, writefd, NULL, &timeout);
  return rc;
}

LIBSSH2_SFTP_HANDLE* AbstractCommand::OpenFile(const std::string path,
                                               const unsigned long flags,
                                               const int mode)
  throw(CommunicationException)
{
  LIBSSH2_SFTP_HANDLE *sftp_handle = NULL;
  do {
    sftp_handle = libssh2_sftp_open(sftp_session_, path.c_str(), flags, mode);
    int last_error_no = libssh2_session_last_errno(session_);
    if (!sftp_handle) {
      if (last_error_no == LIBSSH2_ERROR_EAGAIN) {
        WaitSocket(server_sock_, session_);
      } else {
        THROW_COMMUNICATION_EXCEPTION("Unable to open file with SFTP", last_error_no);
      }
    }
  } while (!sftp_handle);
  return sftp_handle;
}

void AbstractCommand::CloseSftpHandle(LIBSSH2_SFTP_HANDLE *sftp_handle)
  throw(CommunicationException)
{
  if (sftp_handle) {
    int rc = -1;
    do {
      rc = libssh2_sftp_close(sftp_handle);
      if (rc == LIBSSH2_ERROR_EAGAIN) {
        WaitSocket(GetServerSock(), GetSession());
      }
    } while (rc == LIBSSH2_ERROR_EAGAIN);
    if (rc < 0) {
      THROW_COMMUNICATION_EXCEPTION("Closing SFTP handle failed", rc);
    }
  }
}
