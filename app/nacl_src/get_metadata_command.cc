#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_dictionary.h"

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
    CloseSftpHandle(sftp_handle);
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
  std::vector<pp::Var> metadataList;
  LIBSSH2_SFTP_ATTRIBUTES attrs;
  int rc = -1;
  do {
    rc = libssh2_sftp_fstat(sftp_handle, &attrs);
    if (rc == LIBSSH2_ERROR_EAGAIN) {
      WaitSocket(GetServerSock(), GetSession());
    }
  } while (rc == LIBSSH2_ERROR_EAGAIN);
  if (rc == 0) {
    pp::VarDictionary metadata;
    if (attrs.flags & LIBSSH2_SFTP_ATTR_PERMISSIONS) {
      if (LIBSSH2_SFTP_S_ISDIR(attrs.permissions)) {
        metadata.Set(pp::Var("isDirectory"), pp::Var(true));
      } else {
        metadata.Set(pp::Var("isDirectory"), pp::Var(false));
      }
    }
    if (attrs.flags & LIBSSH2_SFTP_ATTR_SIZE) {
      metadata.Set(pp::Var("size"), pp::Var(static_cast<double>(attrs.filesize)));
    }
    if (attrs.flags & LIBSSH2_SFTP_ATTR_ACMODTIME) {
      metadata.Set(pp::Var("modificationTime"), pp::Var(static_cast<double>(attrs.mtime)));
    }
    metadata.Set(pp::Var("name"), pp::Var(path));
    GetListener()->OnMetadataListFetched(GetRequestID(), std::vector<pp::Var>{metadata});
  } else {
    THROW_COMMUNICATION_EXCEPTION("Getting metadata failed", rc);
  }
}
