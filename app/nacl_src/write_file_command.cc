#include <vector>
#include <cstdio>

#include "base64.h"
#include "write_file_command.h"

WriteFileCommand::WriteFileCommand(SftpEventListener *listener,
                                   const int server_sock,
                                   LIBSSH2_SESSION *session,
                                   LIBSSH2_SFTP *sftp_session,
                                   const int request_id,
                                   const std::string &path,
                                   const libssh2_uint64_t offset,
                                   const libssh2_uint64_t length,
                                   const std::string &b64_data)
 : AbstractCommand(session, sftp_session, server_sock, listener, request_id),
   path_(path),
   offset_(offset),
   length_(length),
   b64_data_(b64_data)
{
}

WriteFileCommand::~WriteFileCommand()
{
}

void* WriteFileCommand::Start(void *arg)
{
  WriteFileCommand *instance = static_cast<WriteFileCommand*>(arg);
  instance->Execute();
  return NULL;
}

void WriteFileCommand::Execute()
{
  LIBSSH2_SFTP_HANDLE *sftp_handle = NULL;
  try {
    sftp_handle = OpenFile(path_, LIBSSH2_FXF_WRITE, 0);
    WriteFile(sftp_handle, offset_, length_, b64_data_);
    GetListener()->OnWriteFileFinished(GetRequestID());
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

void WriteFileCommand::WriteFile(LIBSSH2_SFTP_HANDLE *sftp_handle,
                                 const libssh2_uint64_t offset,
                                 const libssh2_uint64_t length,
                                 const std::string &b64_data)
  throw(CommunicationException)
{
  std::vector<unsigned char> data(length);
  base64::Decode(b64_data, data);
  libssh2_sftp_seek64(sftp_handle, offset);
  int rc = -1;
  int w_pos = 0;
  libssh2_uint64_t remain = std::min(length, (const libssh2_uint64_t)data.size());
  do {
    const char *buffer = (char*)&data[w_pos];
    while ((rc = libssh2_sftp_write(sftp_handle, buffer, remain)) == LIBSSH2_ERROR_EAGAIN) {
      WaitSocket(GetServerSock(), GetSession());
    }
    if (rc < 0) {
      THROW_COMMUNICATION_EXCEPTION("Writing file failed", rc);
    }
    w_pos += rc;
    remain -= rc;
  } while (remain);
}
