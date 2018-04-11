#ifndef READ_DIRECTORY_COMMAND_H
#define READ_DIRECTORY_COMMAND_H

#include <string>

#include "libssh2.h"
#include "libssh2_sftp.h"
#include "communication_exception.h"
#include "sftp_event_listener.h"
#include "abstract_command.h"

class ReadDirectoryCommand : protected AbstractCommand
{

 public:

  explicit ReadDirectoryCommand(SftpEventListener *listener,
                                const int server_sock,
                                LIBSSH2_SESSION *session,
                                LIBSSH2_SFTP *sftp_session,
                                const int request_id,
                                const std::string &path);
  virtual ~ReadDirectoryCommand();

  static void* Start(void *arg);

 private:

  std::string path_;

  void Execute();
  LIBSSH2_SFTP_HANDLE* OpenDirectory(const std::string path) throw(CommunicationException);
  void FetchEntriesInDirectory(LIBSSH2_SFTP_HANDLE *sftp_handle) throw(CommunicationException);

};

#endif // READ_DIRECTORY_COMMAND_H
