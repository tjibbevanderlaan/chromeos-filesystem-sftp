#include "get_metadata_command.h"

GetMetadataCommand::GetMetadataCommand(SftpEventListener *listener,
                                       const int server_sock,
                                       LIBSSH2_SESSION *session,
                                       LIBSSH2_SFTP *sftp_session,
                                       const int request_id,
                                       const std::string &path)
  : AbstractCommand(session, sftp_session, server_sock, listener, request_id),
    path_(path)
{
}

GetMetadataCommand::~GetMetadataCommand()
{
}

void* GetMetadataCommand::Start(void *arg)
{
  GetMetadataCommand *instance = static_cast<GetMetadataCommand*>(arg);
  instance->Execute();
  return NULL;
}

void GetMetadataCommand::Execute()
{
  try {
    LIBSSH2_SFTP_HANDLE *sftp_handle = OpenFile(path_, LIBSSH2_FXF_READ, 0);
    FetchEntry(sftp_handle, path_);
    libssh2_sftp_close(sftp_handle);
  } catch(CommunicationException e) {
    std::string msg;
    msg = e.toString();
    GetListener()->OnErrorOccurred(GetRequestID(), msg);
  }
  delete this;
}

void GetMetadataCommand::FetchEntry(LIBSSH2_SFTP_HANDLE *sftp_handle, const std::string &path)
    throw(CommunicationException)
{
  std::vector<Json::Value> metadataList;
  LIBSSH2_SFTP_ATTRIBUTES attrs;
  int rc = -1;
  do {
    rc = libssh2_sftp_fstat(sftp_handle, &attrs);
    if (rc == LIBSSH2_ERROR_EAGAIN) {
      WaitSocket(GetServerSock(), GetSession());
    }
  } while (rc == LIBSSH2_ERROR_EAGAIN);
  if (rc == 0) {
    Json::Value metadata(Json::objectValue);
    if (attrs.flags & LIBSSH2_SFTP_ATTR_PERMISSIONS) {
      if (LIBSSH2_SFTP_S_ISDIR(attrs.permissions)) {
        metadata["isDirectory"] = true;
      } else {
        metadata["isDirectory"] = false;
      }
    }
    if (attrs.flags & LIBSSH2_SFTP_ATTR_SIZE) {
      metadata["size"] = attrs.filesize;
    }
    if (attrs.flags & LIBSSH2_SFTP_ATTR_ACMODTIME) {
      metadata["modificationTime"] = (u_int64_t)attrs.mtime;
    }
    metadata["name"] = path;
    GetListener()->OnMetadataListFetched(GetRequestID(), std::vector<Json::Value>{metadata});
  } else {
    THROW_COMMUNICATION_EXCEPTION("Getting metadata failed", rc);
  }
}
