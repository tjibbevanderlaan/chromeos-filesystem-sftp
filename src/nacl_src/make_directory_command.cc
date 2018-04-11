#include <cstdio>

#include "make_directory_command.h"

MakeDirectoryCommand::MakeDirectoryCommand(SftpEventListener *listener,
                                           const int server_sock,
                                           LIBSSH2_SESSION *session,
                                           LIBSSH2_SFTP *sftp_session,
                                           const int request_id,
                                           const std::string &path)
  : AbstractCommand(session, sftp_session, server_sock, listener, request_id),
    path_(path)
{
  fprintf(stderr, "MakeDirectoryCommand::MakeDirectoryCommand\n");
}

MakeDirectoryCommand::~MakeDirectoryCommand()
{
  fprintf(stderr, "MakeDirectoryCommand::~MakeDirectoryCommand\n");
}

void* MakeDirectoryCommand::Start(void *arg)
{
  MakeDirectoryCommand *instance = static_cast<MakeDirectoryCommand*>(arg);
  instance->Execute();
  return NULL;
}

void MakeDirectoryCommand::Execute()
{
  fprintf(stderr, "MakeDirectoryCommand::Execute\n");
  try {
    Mkdir(path_);
    GetListener()->OnMakeDirectoryFinished(GetRequestID());
  } catch(CommunicationException e) {
    std::string msg;
    msg = e.toString();
    GetListener()->OnErrorOccurred(GetRequestID(), msg);
  }
  fprintf(stderr, "MakeDirectoryCommand::Execute End\n");
  delete this;
}

void MakeDirectoryCommand::Mkdir(const std::string &path) throw(CommunicationException)
{
  fprintf(stderr, "MakeDirectoryCommand::Mkdir path=%s\n", path.c_str());
  int rc = -1;
  do {
    rc = libssh2_sftp_mkdir(GetSftpSession(), path.c_str(),
                            LIBSSH2_SFTP_S_IRWXU |
                            LIBSSH2_SFTP_S_IRGRP | LIBSSH2_SFTP_S_IXGRP |
                            LIBSSH2_SFTP_S_IROTH | LIBSSH2_SFTP_S_IXOTH);
    if (rc == LIBSSH2_ERROR_EAGAIN) {
      WaitSocket(GetServerSock(), GetSession());
    } else if (rc == 0) {
      break;
    } else {
      THROW_COMMUNICATION_EXCEPTION("sftpThreadError_creatingDirectoryFailed", rc);
    }
  } while (rc == LIBSSH2_ERROR_EAGAIN);
  fprintf(stderr, "MakeDirectoryCommand::Mkdir End\n");
}
