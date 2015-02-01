#ifndef CREATE_FILE_COMMAND_H
#define CREATE_FILE_COMMAND_H

#include <string>

#include "libssh2.h"
#include "libssh2_sftp.h"
#include "communication_exception.h"
#include "sftp_event_listener.h"
#include "abstract_command.h"

class CreateFileCommand : protected AbstractCommand
{

 public:

  explicit CreateFileCommand(SftpEventListener *listener,
                             const int server_sock,
                             LIBSSH2_SESSION *session,
                             LIBSSH2_SFTP *sftp_session,
                             const int request_id,
                             const std::string &path);
  virtual ~CreateFileCommand();

  static void* Start(void *arg);

 private:

  std::string path_;

  void Execute();
  void CreateFile(const std::string &path) throw(CommunicationException);

};

#endif // CREATE_FILE_COMMAND_H
