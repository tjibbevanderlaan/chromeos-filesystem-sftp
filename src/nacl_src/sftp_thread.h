#ifndef SFTP_THREAD_H
#define SFTP_THREAD_H

#include <pthread.h>

#include <libssh2.h>
#include <libssh2_sftp.h>

#include "ppapi/cpp/completion_callback.h"
#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var_array_buffer.h"

#include "communication_exception.h"
#include "sftp_event_listener.h"

class SftpThread
{
 public:

  explicit SftpThread(SftpEventListener *listener,
                      const int request_id);
  virtual ~SftpThread();

  void ConnectAndHandshake(const std::string server_hostname, const int server_port);
  void Authenticate(const std::string auth_type,
                    const std::string username,
                    const std::string password,
                    const std::string private_key);
  std::string GetPassword();
  void ReadDirectory(const std::string path);
  void GetMetadata(const std::string path);
  void ReadFile(const std::string path,
                const libssh2_uint64_t offset,
                const libssh2_uint64_t length,
                const unsigned int buffer_size);
  void MakeDirectory(const std::string path);
  void DeleteEntry(const std::string path);
  void RenameEntry(const std::string source_path, const std::string target_path);
  void CreateFile(const std::string path);
  void WriteFile(const std::string path,
                 const libssh2_uint64_t offset,
                 const size_t length,
                 const pp::VarArrayBuffer &buffer);
  void TruncateFile(const std::string path,
                    const libssh2_uint64_t length);
  void Close();

 private:

  pthread_t thread_;
  SftpEventListener *listener_;
  int request_id_;

  std::string server_hostname_;
  int server_port_;

  std::string auth_type_;
  std::string username_;
  std::string password_;
  std::string private_key_;

  int server_sock_;
  LIBSSH2_SESSION *session_;

  LIBSSH2_SFTP *sftp_session_;

  // Connection and handshaking
  static void* StartConnectAndHandshakeThread(void *arg);
  void ConnectAndHandshakeImpl();
  void InitializeLibssh2() throw(CommunicationException);
  int ConnectToSshServer(const std::string &hostname, const int port) throw(CommunicationException);
  LIBSSH2_SESSION* InitializeSession() throw(CommunicationException);
  void SetKEXMethodPrefs(LIBSSH2_SESSION *session) throw(CommunicationException);
  void HandshakeSession(LIBSSH2_SESSION *session,
                        int sock) throw(CommunicationException);
  std::string GetHostKeyHash(LIBSSH2_SESSION *session);
  std::string GetHostKeyMethod(LIBSSH2_SESSION *session);

  // Authentication
  static void* StartAuthenticate(void *arg);
  void AuthenticateImpl();
  void AuthenticateUser() throw(CommunicationException);
  void AuthenticateByPassword(LIBSSH2_SESSION *session,
                              const std::string &username,
                              const std::string &password)
    throw(CommunicationException);
  void AuthenticateByKeyboardInteractive(LIBSSH2_SESSION *session,
                                         const std::string &username,
                                         const std::string &password)
    throw(CommunicationException);
  static void KeyboardCallback(const char *name,
                               int name_len,
                               const char *instruction,
                               int instruction_len,
                               int num_prompts,
                               const LIBSSH2_USERAUTH_KBDINT_PROMPT *prompts,
                               LIBSSH2_USERAUTH_KBDINT_RESPONSE *response,
                               void **abstract);
  void AuthenticateByPublicKey(LIBSSH2_SESSION *session,
                               const std::string &username,
                               const std::string &password,
                               const std::string &private_key)
    throw(CommunicationException);
  void SetNonBlocking(LIBSSH2_SESSION *session);

  // SFTP initializing
  LIBSSH2_SFTP* OpenSftpSession(LIBSSH2_SESSION *session) throw(CommunicationException);

  int WaitSocket(int socket_fd, LIBSSH2_SESSION *session);

  // Closing
  static void* StartClose(void *arg);
  void CloseImpl();
  void CloseSession(LIBSSH2_SESSION *session);
  void CloseSftpSession(LIBSSH2_SFTP *sftp_session);

};

#endif // SFTP_THREAD_H
