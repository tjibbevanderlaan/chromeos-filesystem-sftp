#ifndef TRUNCATE_FILE_COMMAND_H
#define TRUNCATE_FILE_COMMAND_H

#include <string>

#include "libssh2.h"
#include "libssh2_sftp.h"
#include "communication_exception.h"
#include "sftp_event_listener.h"
#include "abstract_command.h"

class TruncateFileCommand : protected AbstractCommand
{

 public:

  explicit TruncateFileCommand(SftpEventListener *listener,
                               const int server_sock,
                               LIBSSH2_SESSION *session,
                               LIBSSH2_SFTP *sftp_session,
                               const int request_id,
                               const std::string &path,
                               const libssh2_uint64_t length);
  virtual ~TruncateFileCommand();

  static void* Start(void *arg);

 private:

  std::string path_;
  libssh2_uint64_t length_;

  void Execute();
  libssh2_uint64_t GetFileSize(LIBSSH2_SFTP_HANDLE *sftp_handle)
    throw(CommunicationException);
  void ReadFileLengthOf(LIBSSH2_SFTP_HANDLE *sftp_handle,
                        const libssh2_uint64_t length,
                        std::vector<char> &buffer)
    throw(CommunicationException);
  void WriteFile(LIBSSH2_SFTP_HANDLE *handle, std::vector<char> &data)
    throw(CommunicationException);

};

#endif // TRUNCATE_FILE_COMMAND_H
