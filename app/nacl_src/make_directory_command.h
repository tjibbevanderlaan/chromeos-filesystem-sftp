#ifndef MAKE_DIRECTORY_COMMAND_H
#define MAKE_DIRECTORY_COMMAND_H

#include <string>

#include "libssh2.h"
#include "libssh2_sftp.h"
#include "communication_exception.h"
#include "sftp_event_listener.h"
#include "abstract_command.h"

class MakeDirectoryCommand : protected AbstractCommand
{

 public:

  explicit MakeDirectoryCommand(SftpEventListener *listener,
                                const int server_sock,
                                LIBSSH2_SESSION *session,
                                LIBSSH2_SFTP *sftp_session,
                                const int request_id,
                                const std::string &path);
  virtual ~MakeDirectoryCommand();

  static void* Start(void *arg);

 private:

  std::string path_;

  void Execute();
  void Mkdir(const std::string &path) throw(CommunicationException);

};

#endif // MAKE_DIRECTORY_COMMAND_H
