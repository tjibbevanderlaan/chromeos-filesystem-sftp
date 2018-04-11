#ifndef ABSTRACT_COMMAND_H
#define ABSTRACT_COMMAND_H

#include <string>

#include "libssh2.h"
#include "libssh2_sftp.h"
#include "communication_exception.h"
#include "sftp_event_listener.h"

class AbstractCommand
{

 public:

  explicit AbstractCommand(LIBSSH2_SESSION *session,
                           LIBSSH2_SFTP *sftp_session,
                           const int server_sock,
                           SftpEventListener *listener,
                           const int request_id);
  virtual ~AbstractCommand();

  virtual int WaitSocket(int socket_fd, LIBSSH2_SESSION *session);
  virtual LIBSSH2_SFTP_HANDLE* OpenFile(const std::string path,
                                        const unsigned long flags,
                                        const int mode)
    throw(CommunicationException);
  virtual void CloseSftpHandle(LIBSSH2_SFTP_HANDLE *sftp_handle)
    throw(CommunicationException);

  virtual LIBSSH2_SESSION* GetSession();
  virtual LIBSSH2_SFTP* GetSftpSession();
  virtual int GetServerSock();
  virtual SftpEventListener* GetListener();
  virtual int GetRequestID();

 private:

  LIBSSH2_SESSION *session_;
  LIBSSH2_SFTP *sftp_session_;
  int server_sock_;
  SftpEventListener *listener_;
  int request_id_;

};

#endif // ABSTRACT_COMMAND_H
