#ifndef DELETE_ENTRY_COMMAND_H
#define DELETE_ENTRY_COMMAND_H

#include <string>

#include "libssh2.h"
#include "libssh2_sftp.h"
#include "communication_exception.h"
#include "sftp_event_listener.h"
#include "abstract_command.h"

class DeleteEntryCommand : protected AbstractCommand
{

 public:

  explicit DeleteEntryCommand(SftpEventListener *listener,
                              const int server_sock,
                              LIBSSH2_SESSION *session,
                              LIBSSH2_SFTP *sftp_session,
                              const int request_id,
                              const std::string &path);
  virtual ~DeleteEntryCommand();

  static void* Start(void *arg);

 private:

  std::string path_;

  void Execute();
  bool IsFile(LIBSSH2_SFTP_HANDLE *handle) throw(CommunicationException);
  void DeleteFile(const std::string &path) throw(CommunicationException);
  void DeleteDirectory(const std::string &path) throw(CommunicationException);

};

#endif // DELETE_ENTRY_COMMAND_H
