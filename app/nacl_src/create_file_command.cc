#include "create_file_command.h"

CreateFileCommand::CreateFileCommand(SftpEventListener *listener,
                                     const int server_sock,
                                     LIBSSH2_SESSION *session,
                                     LIBSSH2_SFTP *sftp_session,
                                     const int request_id,
                                     const std::string &path)
  : AbstractCommand(session, sftp_session, server_sock, listener, request_id),
    path_(path)
{
}

CreateFileCommand::~CreateFileCommand()
{
}

void* CreateFileCommand::Start(void *arg)
{
  CreateFileCommand *instance = static_cast<CreateFileCommand*>(arg);
  instance->Execute();
  return NULL;
}

void CreateFileCommand::Execute()
{
  try {
    CreateFile(path_);
    GetListener()->OnCreateFileFinished(GetRequestID());
  } catch(CommunicationException e) {
    std::string msg;
    msg = e.toString();
    GetListener()->OnErrorOccurred(GetRequestID(), msg);
  }
  delete this;
}

void CreateFileCommand::CreateFile(const std::string &path)
  throw(CommunicationException)
{
  LIBSSH2_SFTP_HANDLE *sftp_handle = NULL;
  do {
    sftp_handle = libssh2_sftp_open(GetSftpSession(),
                                    path.c_str(),
                                    LIBSSH2_FXF_CREAT | LIBSSH2_FXF_TRUNC,
                                    LIBSSH2_SFTP_S_IRUSR | LIBSSH2_SFTP_S_IWUSR |
                                    LIBSSH2_SFTP_S_IRGRP |
                                    LIBSSH2_SFTP_S_IROTH);
    int last_error_no = libssh2_session_last_errno(GetSession());
    if (!sftp_handle) {
      if (last_error_no == LIBSSH2_ERROR_EAGAIN) {
        WaitSocket(GetServerSock(), GetSession());
      } else {
        THROW_COMMUNICATION_EXCEPTION("Unable to create file with SFTP", last_error_no);
      }
    }
  } while (!sftp_handle);
  CloseSftpHandle(sftp_handle);
}
