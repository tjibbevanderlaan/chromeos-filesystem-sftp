#ifndef WRITE_FILE_COMMAND_H
#define WRITE_FILE_COMMAND_H

#include <string>

#include "ppapi/cpp/var_array_buffer.h"

#include "libssh2.h"
#include "libssh2_sftp.h"

#include "communication_exception.h"
#include "sftp_event_listener.h"
#include "abstract_command.h"

class WriteFileCommand : protected AbstractCommand
{

 public:

  explicit WriteFileCommand(SftpEventListener *listener,
                            const int server_sock,
                            LIBSSH2_SESSION *session,
                            LIBSSH2_SFTP *sftp_session,
                            const int request_id,
                            const std::string &path,
                            const libssh2_uint64_t offset,
                            const size_t length,
                            const pp::VarArrayBuffer &data);
  virtual ~WriteFileCommand();

  static void* Start(void *arg);

 private:

  std::string path_;
  libssh2_uint64_t offset_;
  size_t length_;
  pp::VarArrayBuffer data_;

  void Execute();
  void WriteFile(LIBSSH2_SFTP_HANDLE *sftp_handle,
                 const libssh2_uint64_t offset,
                 const size_t length,
                 pp::VarArrayBuffer &buffer)
    throw(CommunicationException);

};

#endif // WRITE_FILE_COMMAND_H
