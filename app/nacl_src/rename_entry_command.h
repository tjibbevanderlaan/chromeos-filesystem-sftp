#ifndef RENAME_ENTRY_COMMAND_H
#define RENAME_ENTRY_COMMAND_H

#include <string>

#include "libssh2.h"
#include "libssh2_sftp.h"
#include "communication_exception.h"
#include "sftp_event_listener.h"
#include "abstract_command.h"

class RenameEntryCommand : protected AbstractCommand
{

 public:

  explicit RenameEntryCommand(SftpEventListener *listener,
                              const int server_sock,
                              LIBSSH2_SESSION *session,
                              LIBSSH2_SFTP *sftp_session,
                              const int request_id,
                              const std::string &source_path,
                              const std::string &target_path);
  virtual ~RenameEntryCommand();

  static void* Start(void *arg);

 private:

  std::string source_path_;
  std::string target_path_;

  void Execute();
  void RenameEntry(const std::string &source_path, const std::string &target_path)
    throw(CommunicationException);

};

#endif // DELETE_ENTRY_COMMAND_H
