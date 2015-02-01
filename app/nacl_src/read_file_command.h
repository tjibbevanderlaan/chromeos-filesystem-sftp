#ifndef READ_FILE_COMMAND_H
#define READ_FILE_COMMAND_H

#include <string>

#include "libssh2.h"
#include "libssh2_sftp.h"
#include "communication_exception.h"
#include "sftp_event_listener.h"
#include "abstract_command.h"

class ReadFileCommand : protected AbstractCommand
{

 public:

  explicit ReadFileCommand(SftpEventListener *listener,
                           const int server_sock,
                           LIBSSH2_SESSION *session,
                           LIBSSH2_SFTP *sftp_session,
                           const int request_id,
                           const std::string &path,
                           const libssh2_uint64_t offset,
                           const libssh2_uint64_t length);
  virtual ~ReadFileCommand();

  static void* Start(void *arg);

 private:

  std::string path_;
  libssh2_uint64_t offset_;
  libssh2_uint64_t length_;

  void Execute();
  void SeekAtOffsetOf(LIBSSH2_SFTP_HANDLE *sftp_handle, const libssh2_uint64_t offset);
  void ReadFileLengthOf(LIBSSH2_SFTP_HANDLE *sftp_handle, const libssh2_uint64_t length)
    throw(CommunicationException);

};

#endif // READ_FILE_COMMAND_H
