#include <vector>
#include <cstdio>

#include "truncate_file_command.h"

TruncateFileCommand::TruncateFileCommand(SftpEventListener *listener,
                                         const int server_sock,
                                         LIBSSH2_SESSION *session,
                                         LIBSSH2_SFTP *sftp_session,
                                         const int request_id,
                                         const std::string &path,
                                         const libssh2_uint64_t length)
 : AbstractCommand(session, sftp_session, server_sock, listener, request_id),
   path_(path),
   length_(length)
{
}

TruncateFileCommand::~TruncateFileCommand()
{
}

void* TruncateFileCommand::Start(void *arg)
{
  TruncateFileCommand *instance = static_cast<TruncateFileCommand*>(arg);
  instance->Execute();
  return NULL;
}

// FIXME: Currently, very dangerous implementation.
// std::vector should NOT be used for the cache purpose.
// Probably, the read data should write as the file temporarily.
void TruncateFileCommand::Execute()
{
  LIBSSH2_SFTP_HANDLE *sftp_handle = NULL;
  try {
    sftp_handle = OpenFile(path_, LIBSSH2_FXF_READ, 0);
    libssh2_uint64_t file_size = GetFileSize(sftp_handle);
    std::vector<char> buffer;
    ReadFileLengthOf(sftp_handle, std::min(file_size, length_), buffer);
    CloseSftpHandle(sftp_handle);
    sftp_handle = OpenFile(path_,
                           LIBSSH2_FXF_WRITE | LIBSSH2_FXF_CREAT |
                           LIBSSH2_FXF_TRUNC,
                           LIBSSH2_SFTP_S_IRUSR | LIBSSH2_SFTP_S_IWUSR |
                           LIBSSH2_SFTP_S_IRGRP |
                           LIBSSH2_SFTP_S_IROTH);
    WriteFile(sftp_handle, buffer);
    int remain = length_ - buffer.size();
    if (remain > 0) {
      std::vector<char> zero_buffer(remain, 0);
      WriteFile(sftp_handle, zero_buffer);
    }
    GetListener()->OnTruncateFileFinished(GetRequestID());
  } catch(CommunicationException e) {
    std::string msg;
    msg = e.toString();
    GetListener()->OnErrorOccurred(GetRequestID(), msg);
  }
  CloseSftpHandle(sftp_handle);
  delete this;
}

libssh2_uint64_t TruncateFileCommand::GetFileSize(LIBSSH2_SFTP_HANDLE *sftp_handle)
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
    if (attrs.flags & LIBSSH2_SFTP_ATTR_SIZE) {
      return attrs.filesize;
    } else {
      THROW_COMMUNICATION_EXCEPTION("Filesize not found", rc);
    }
  } else {
    THROW_COMMUNICATION_EXCEPTION("Getting filesize failed", rc);
  }
}

void TruncateFileCommand::ReadFileLengthOf(LIBSSH2_SFTP_HANDLE *sftp_handle,
                                           const libssh2_uint64_t length,
                                           std::vector<char> &buffer)
  throw(CommunicationException)
{
  int rc = -1;
  libssh2_uint64_t total = 0;
  buffer.reserve(length);
  do {
    char mem[32 * 1024];
    rc = libssh2_sftp_read(sftp_handle, mem, sizeof(mem));
    if (rc == LIBSSH2_ERROR_EAGAIN) {
      WaitSocket(GetServerSock(), GetSession());
    } else if (rc >= 0) {
      if (rc == 0) { // No more data
        fprintf(stderr, "Reading for truncate completed - 2\n");
        break;
      } else {
        if (length == total + rc) { // Read completed
          for (int i = 0; i < rc; i++) {
            buffer.push_back(mem[i]);
          }
          break;
        } else if (length < total + rc) { // Over-reading
          for (libssh2_uint64_t i = 0; i < length - total; i++) {
            buffer.push_back(mem[i]);
          }
          break;
        } else if (length > total + rc) { // Data remains
          for (int i = 0; i < rc; i++) {
            buffer.push_back(mem[i]);
          }
          total += rc;
        }
      }
    } else {
      THROW_COMMUNICATION_EXCEPTION("Reading file failed", rc);
    }
  } while (1);
}

void TruncateFileCommand::WriteFile(LIBSSH2_SFTP_HANDLE *sftp_handle,
                                    std::vector<char> &data)
  throw(CommunicationException)
{
  int rc = -1;
  int w_pos = 0;
  int remain = data.size();
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
