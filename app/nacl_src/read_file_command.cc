#include <cstdio>

#include "base64.h"
#include "read_file_command.h"

ReadFileCommand::ReadFileCommand(SftpEventListener *listener,
                                 const int server_sock,
                                 LIBSSH2_SESSION *session,
                                 LIBSSH2_SFTP *sftp_session,
                                 const int request_id,
                                 const std::string &path,
                                 const libssh2_uint64_t offset,
                                 const libssh2_uint64_t length,
                                 const unsigned int buffer_size)
: AbstractCommand(session, sftp_session, server_sock, listener, request_id),
  path_(path),
  offset_(offset),
  length_(length),
  buffer_size_(buffer_size)
{
}

ReadFileCommand::~ReadFileCommand()
{
}

void* ReadFileCommand::Start(void *arg)
{
  ReadFileCommand *instance = static_cast<ReadFileCommand*>(arg);
  instance->Execute();
  return NULL;
}

void ReadFileCommand::Execute()
{
  try {
    LIBSSH2_SFTP_HANDLE *sftp_handle = OpenFile(path_, LIBSSH2_FXF_READ, 0);
    SeekAtOffsetOf(sftp_handle, offset_);
    ReadFileLengthOf(sftp_handle, length_, buffer_size_);
    libssh2_sftp_close(sftp_handle);
  } catch(CommunicationException e) {
    std::string msg;
    msg = e.toString();
    GetListener()->OnErrorOccurred(GetRequestID(), msg);
  }
  delete this;
}


void ReadFileCommand::SeekAtOffsetOf(LIBSSH2_SFTP_HANDLE *sftp_handle,
                                     const libssh2_uint64_t offset)
{
  libssh2_sftp_seek64(sftp_handle, offset);
}

void ReadFileCommand::ReadFileLengthOf(LIBSSH2_SFTP_HANDLE *sftp_handle,
                                       const libssh2_uint64_t length,
                                       const unsigned int buffer_size)
  throw(CommunicationException)
{
  int rc = -1;
  int max_buf_size = 2048;
  libssh2_uint64_t total = 0;
  std::vector<unsigned char> result_buf;
  result_buf.reserve((buffer_size + 1) * 1024);
  do {
    int buf_size = std::min((libssh2_uint64_t)max_buf_size, length - total);
    char mem[buf_size];
    rc = libssh2_sftp_read(sftp_handle, mem, sizeof(mem));
    if (rc == LIBSSH2_ERROR_EAGAIN) {
      WaitSocket(GetServerSock(), GetSession());
    } else if (rc >= 0) {
      total += rc;
      fprintf(stderr, "buf_size: %d, rc:%d total:%llu length:%llu result_buf:%d\n", buf_size, rc, total, length, result_buf.size());
      if (rc == 0) {
        fprintf(stderr, "Reading completed - 2\n");
        std::string b64encoded;
        base64::Encode(result_buf, b64encoded);
        GetListener()->OnReadFile(GetRequestID(), b64encoded, result_buf.size(), false);
        break;
      } else {
        for (int i = 0; i < rc; i++) {
          result_buf.push_back(mem[i]);
        }
        if (length <= total) {
          fprintf(stderr, "Reading completed - 1\n");
          std::string b64encoded;
          base64::Encode(result_buf, b64encoded);
          GetListener()->OnReadFile(GetRequestID(), b64encoded, result_buf.size(), false);
          break;
        } else if (result_buf.size() >= (buffer_size * 1024)) {
          fprintf(stderr, "Flush\n");
          std::string b64encoded;
          base64::Encode(result_buf, b64encoded);
          GetListener()->OnReadFile(GetRequestID(), b64encoded, result_buf.size(), true);
          result_buf.clear();
        }
      }
    } else {
      THROW_COMMUNICATION_EXCEPTION("Reading file failed", rc);
    }
  } while (1);
}
