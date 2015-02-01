#include "read_directory_command.h"

ReadDirectoryCommand::ReadDirectoryCommand(SftpEventListener *listener,
                                           const int server_sock,
                                           LIBSSH2_SESSION *session,
                                           LIBSSH2_SFTP *sftp_session,
                                           const int request_id,
                                           const std::string &path)
  : AbstractCommand(session, sftp_session, server_sock, listener, request_id),
    path_(path)
{
}

ReadDirectoryCommand::~ReadDirectoryCommand()
{
}

void* ReadDirectoryCommand::Start(void *arg)
{
  ReadDirectoryCommand *instance = static_cast<ReadDirectoryCommand*>(arg);
  instance->Execute();
  return NULL;
}

void ReadDirectoryCommand::Execute()
{
  try {
    LIBSSH2_SFTP_HANDLE *sftp_handle = OpenDirectory(path_);
    FetchEntriesInDirectory(sftp_handle);
    libssh2_sftp_closedir(sftp_handle);
  } catch(CommunicationException e) {
    std::string msg;
    msg = e.toString();
    GetListener()->OnErrorOccurred(GetRequestID(), msg);
  }
  delete this;
}

LIBSSH2_SFTP_HANDLE* ReadDirectoryCommand::OpenDirectory(const std::string path)
    throw(CommunicationException)
{
  LIBSSH2_SFTP_HANDLE *sftp_handle = NULL;
  do {
    sftp_handle = libssh2_sftp_opendir(GetSftpSession(), path.c_str());
    int last_error_no = libssh2_session_last_errno(GetSession());
    if (!sftp_handle) {
      if (last_error_no == LIBSSH2_ERROR_EAGAIN) {
        WaitSocket(GetServerSock(), GetSession());
      } else {
        THROW_COMMUNICATION_EXCEPTION("Unable to open dir with SFTP", last_error_no);
      }
    }
  } while (!sftp_handle);
  return sftp_handle;
}

void ReadDirectoryCommand::FetchEntriesInDirectory(LIBSSH2_SFTP_HANDLE *sftp_handle)
    throw(CommunicationException)
{
  std::vector<Json::Value> metadataList;
  do {
    char mem[512];
    LIBSSH2_SFTP_ATTRIBUTES attrs;
    int rc = -1;
    do {
      rc = libssh2_sftp_readdir(sftp_handle, mem, sizeof(mem), &attrs);
      if (rc == LIBSSH2_ERROR_EAGAIN) {
        WaitSocket(GetServerSock(), GetSession());
      }
    } while (rc == LIBSSH2_ERROR_EAGAIN);
    if (rc > 0) {
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
      metadata["name"] = mem;
      metadataList.push_back(metadata);
    } else {
      break;
    }
  } while (1);
  GetListener()->OnMetadataListFetched(GetRequestID(), metadataList);
}
