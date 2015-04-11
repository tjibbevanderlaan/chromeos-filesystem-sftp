#include <cstdio>

#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_dictionary.h"

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
  fprintf(stderr, "ReadDirectoryCommand::ReadDirectoryCommand\n");
}

ReadDirectoryCommand::~ReadDirectoryCommand()
{
  fprintf(stderr, "ReadDirectoryCommand::~ReadDirectoryCommand\n");
}

void* ReadDirectoryCommand::Start(void *arg)
{
  ReadDirectoryCommand *instance = static_cast<ReadDirectoryCommand*>(arg);
  instance->Execute();
  return NULL;
}

void ReadDirectoryCommand::Execute()
{
  fprintf(stderr, "ReadDirectoryCommand::Execute\n");
  try {
    LIBSSH2_SFTP_HANDLE *sftp_handle = OpenDirectory(path_);
    FetchEntriesInDirectory(sftp_handle);
    CloseSftpHandle(sftp_handle);
  } catch(CommunicationException e) {
    std::string msg;
    msg = e.toString();
    GetListener()->OnErrorOccurred(GetRequestID(), msg);
  }
  fprintf(stderr, "ReadDirectoryCommand::Execute End\n");
  delete this;
}

LIBSSH2_SFTP_HANDLE* ReadDirectoryCommand::OpenDirectory(const std::string path)
    throw(CommunicationException)
{
  fprintf(stderr, "ReadDirectoryCommand::OpenDirectory\n");
  LIBSSH2_SFTP_HANDLE *sftp_handle = NULL;
  do {
    sftp_handle = libssh2_sftp_opendir(GetSftpSession(), path.c_str());
    int last_error_no = libssh2_session_last_errno(GetSession());
    fprintf(stderr, "ReadDirectoryCommand::OpenDirectory errno=%d\n", last_error_no);
    if (!sftp_handle) {
      if (last_error_no == LIBSSH2_ERROR_EAGAIN) {
        WaitSocket(GetServerSock(), GetSession());
      } else {
        THROW_COMMUNICATION_EXCEPTION("Unable to open dir with SFTP", last_error_no);
      }
    }
  } while (!sftp_handle);
  fprintf(stderr, "ReadDirectoryCommand::OpenDirectory End\n");
  return sftp_handle;
}

void ReadDirectoryCommand::FetchEntriesInDirectory(LIBSSH2_SFTP_HANDLE *sftp_handle)
    throw(CommunicationException)
{
  fprintf(stderr, "ReadDirectoryCommand::FetchEntriesInDirectory\n");
  std::vector<pp::Var> metadataList;
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
    fprintf(stderr, "ReadDirectoryCommand::FetchEntriesInDirectory rc=%d\n", rc);
    if (rc > 0) {
      pp::VarDictionary metadata;
      if (attrs.flags & LIBSSH2_SFTP_ATTR_PERMISSIONS) {
        if (LIBSSH2_SFTP_S_ISDIR(attrs.permissions)) {
          metadata.Set(pp::Var("isDirectory"), pp::Var(true));
        } else if (LIBSSH2_SFTP_S_ISREG(attrs.permissions)) {
          metadata.Set(pp::Var("isDirectory"), pp::Var(false));
        } else {
          // Ignore special file
          continue;
        }
      }
      if (attrs.flags & LIBSSH2_SFTP_ATTR_SIZE) {
        metadata.Set(pp::Var("size"), pp::Var(static_cast<double>(attrs.filesize)));
      }
      if (attrs.flags & LIBSSH2_SFTP_ATTR_ACMODTIME) {
        metadata.Set(pp::Var("modificationTime"), pp::Var(static_cast<double>(attrs.mtime)));
      }
      metadata.Set(pp::Var("name"), pp::Var(mem));
      metadataList.push_back(metadata);
    } else {
      break;
    }
  } while (1);
  GetListener()->OnMetadataListFetched(GetRequestID(), metadataList);
  fprintf(stderr, "ReadDirectoryCommand::FetchEntriesInDirectory End\n");
}
