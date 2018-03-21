#ifndef GET_METADATA_COMMAND_H
#define GET_METADATA_COMMAND_H

#include <string>

#include "libssh2.h"
#include "libssh2_sftp.h"
#include "communication_exception.h"
#include "sftp_event_listener.h"
#include "abstract_command.h"

class GetMetadataCommand : protected AbstractCommand
{

 public:

  explicit GetMetadataCommand(SftpEventListener *listener,
                              const int server_sock,
                              LIBSSH2_SESSION *session,
                              LIBSSH2_SFTP *sftp_session,
                              const int request_id,
                              const std::string &path);
  virtual ~GetMetadataCommand();

  static void* Start(void *arg);

 private:

  std::string path_;

  void Execute();
  void FetchEntry(LIBSSH2_SFTP_HANDLE *sftp_handle, const std::string &path) throw(CommunicationException);

};

#endif // GET_METADATA_COMMAND_H
