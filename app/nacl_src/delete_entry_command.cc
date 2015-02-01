#include "delete_entry_command.h"

DeleteEntryCommand::DeleteEntryCommand(SftpEventListener *listener,
                                       const int server_sock,
                                       LIBSSH2_SESSION *session,
                                       LIBSSH2_SFTP *sftp_session,
                                       const int request_id,
                                       const std::string &path)
  : AbstractCommand(session, sftp_session, server_sock, listener, request_id),
    path_(path)
{
}

DeleteEntryCommand::~DeleteEntryCommand()
{
}

void* DeleteEntryCommand::Start(void *arg)
{
  DeleteEntryCommand *instance = static_cast<DeleteEntryCommand*>(arg);
  instance->Execute();
  return NULL;
}

void DeleteEntryCommand::Execute()
{
  LIBSSH2_SFTP_HANDLE *sftp_handle = NULL;
  try {
    sftp_handle = OpenFile(path_, LIBSSH2_FXF_READ, 0);
    if (IsFile(sftp_handle)) {
      DeleteFile(path_);
    } else {
      DeleteDirectory(path_);
    }
    GetListener()->OnDeleteEntryFinished(GetRequestID());
  } catch(CommunicationException e) {
    std::string msg;
    msg = e.toString();
    GetListener()->OnErrorOccurred(GetRequestID(), msg);
  }
  if (sftp_handle) {
    libssh2_sftp_close(sftp_handle);
  }
  delete this;
}

void DeleteEntryCommand::DeleteFile(const std::string &path) throw(CommunicationException)
{
  int rc = -1;
  do {
    rc = libssh2_sftp_unlink(GetSftpSession(), path.c_str());
    if (rc == LIBSSH2_ERROR_EAGAIN) {
      WaitSocket(GetServerSock(), GetSession());
    }
  } while (rc == LIBSSH2_ERROR_EAGAIN);
  if (rc < 0) {
    THROW_COMMUNICATION_EXCEPTION("Deleting file failed", rc);
  }
}

void DeleteEntryCommand::DeleteDirectory(const std::string &path)
  throw(CommunicationException)
{
  int rc = -1;
  do {
    rc = libssh2_sftp_rmdir(GetSftpSession(), path.c_str());
    if (rc == LIBSSH2_ERROR_EAGAIN) {
      WaitSocket(GetServerSock(), GetSession());
    }
  } while (rc == LIBSSH2_ERROR_EAGAIN);
  if (rc < 0) {
    THROW_COMMUNICATION_EXCEPTION("Deleting directory failed", rc);
  }
}

bool DeleteEntryCommand::IsFile(LIBSSH2_SFTP_HANDLE *sftp_handle)
    throw(CommunicationException)
{
  LIBSSH2_SFTP_ATTRIBUTES attrs;
  int rc = -1;
  do {
    rc = libssh2_sftp_fstat(sftp_handle, &attrs);
    if (rc == LIBSSH2_ERROR_EAGAIN) {
      WaitSocket(GetServerSock(), GetSession());
    }
  } while (rc == LIBSSH2_ERROR_EAGAIN);
  if (rc == 0) {
    if (attrs.flags & LIBSSH2_SFTP_ATTR_PERMISSIONS) {
      if (LIBSSH2_SFTP_S_ISDIR(attrs.permissions)) {
        return false;
      } else {
        return true;
      }
    } else {
      THROW_COMMUNICATION_EXCEPTION("Checking entry type failed", rc);
    }
  } else {
    THROW_COMMUNICATION_EXCEPTION("Fetching entry type failed", rc);
  }
}
