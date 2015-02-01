#include "rename_entry_command.h"

RenameEntryCommand::RenameEntryCommand(SftpEventListener *listener,
                                       const int server_sock,
                                       LIBSSH2_SESSION *session,
                                       LIBSSH2_SFTP *sftp_session,
                                       const int request_id,
                                       const std::string &source_path,
                                       const std::string &target_path)
  : AbstractCommand(session, sftp_session, server_sock, listener, request_id),
    source_path_(source_path),
    target_path_(target_path)
{
}

RenameEntryCommand::~RenameEntryCommand()
{
}

void* RenameEntryCommand::Start(void *arg)
{
  RenameEntryCommand *instance = static_cast<RenameEntryCommand*>(arg);
  instance->Execute();
  return NULL;
}

void RenameEntryCommand::Execute()
{
  try {
    RenameEntry(source_path_, target_path_);
    GetListener()->OnRenameEntryFinished(GetRequestID());
  } catch(CommunicationException e) {
    std::string msg;
    msg = e.toString();
    GetListener()->OnErrorOccurred(GetRequestID(), msg);
  }
  delete this;
}

void RenameEntryCommand::RenameEntry(const std::string &source_path,
                                     const std::string &target_path)
  throw(CommunicationException)
{
  int rc = -1;
  do {
    rc = libssh2_sftp_rename(GetSftpSession(), source_path.c_str(), target_path.c_str());
    if (rc == LIBSSH2_ERROR_EAGAIN) {
      WaitSocket(GetServerSock(), GetSession());
    }
  } while (rc == LIBSSH2_ERROR_EAGAIN);
  if (rc < 0) {
    THROW_COMMUNICATION_EXCEPTION("Renaming entry failed", rc);
  }
}
