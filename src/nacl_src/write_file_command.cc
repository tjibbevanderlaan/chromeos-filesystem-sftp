#include <vector>
#include <cstdio>

#include "write_file_command.h"

WriteFileCommand::WriteFileCommand(SftpEventListener *listener,
                                   const int server_sock,
                                   LIBSSH2_SESSION *session,
                                   LIBSSH2_SFTP *sftp_session,
                                   const int request_id,
                                   const std::string &path,
                                   const libssh2_uint64_t offset,
                                   const size_t length,
                                   const pp::VarArrayBuffer &data)
 : AbstractCommand(session, sftp_session, server_sock, listener, request_id),
   path_(path),
   offset_(offset),
   length_(length),
   data_(data)
{
  fprintf(stderr, "WriteFileCommand::WriteFileCommand\n");
}

WriteFileCommand::~WriteFileCommand()
{
  fprintf(stderr, "WriteFileCommand::~WriteFileCommand\n");
}

void* WriteFileCommand::Start(void *arg)
{
  WriteFileCommand *instance = static_cast<WriteFileCommand*>(arg);
  instance->Execute();
  return NULL;
}

void WriteFileCommand::Execute()
{
  fprintf(stderr, "WriteFileCommand::Execute\n");
  LIBSSH2_SFTP_HANDLE *sftp_handle = NULL;
  try {
    sftp_handle = OpenFile(path_, LIBSSH2_FXF_WRITE, 0);
    WriteFile(sftp_handle, offset_, length_, data_);
    GetListener()->OnWriteFileFinished(GetRequestID());
  } catch(CommunicationException e) {
    std::string msg;
    msg = e.toString();
    GetListener()->OnErrorOccurred(GetRequestID(), e.getResultCode(), msg);
  }
  if (sftp_handle) {
    CloseSftpHandle(sftp_handle);
  }
  fprintf(stderr, "WriteFileCommand::Execute End\n");
  delete this;
}

void WriteFileCommand::WriteFile(LIBSSH2_SFTP_HANDLE *sftp_handle,
                                 const libssh2_uint64_t offset,
                                 const size_t length,
                                 pp::VarArrayBuffer &buffer)
  throw(CommunicationException)
{
  fprintf(stderr, "WriteFileCommand::WriteFile\n");
  libssh2_sftp_seek64(sftp_handle, offset);
  int rc = -1;
  int w_pos = 0;
  uint32_t data_length = buffer.ByteLength();
  size_t remain = std::min(length, static_cast<size_t>(data_length));
  char* data = static_cast<char*>(buffer.Map());
  do {
    while ((rc = libssh2_sftp_write(sftp_handle, (data + w_pos), remain)) == LIBSSH2_ERROR_EAGAIN) {
      WaitSocket(GetServerSock(), GetSession());
    }
    fprintf(stderr, "WriteFileCommand::WriteFile rc=%d\n", rc);
    if (rc < 0) {
      THROW_COMMUNICATION_EXCEPTION("sftpThreadError_writeFileFailed", rc);
    }
    w_pos += rc;
    remain -= rc;
  } while (remain);
  fprintf(stderr, "WriteFileCommand::WriteFile End\n");
}
