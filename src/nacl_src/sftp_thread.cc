#include <sys/socket.h>
#include <errno.h>
#include <sstream>
#include <iomanip>
#include <sys/select.h>

#include "ppapi/cpp/var.h"

#include "sftp_thread.h"

#include "read_directory_command.h"
#include "get_metadata_command.h"
#include "read_file_command.h"
#include "make_directory_command.h"
#include "delete_entry_command.h"
#include "rename_entry_command.h"
#include "create_file_command.h"
#include "write_file_command.h"
#include "truncate_file_command.h"

// --- public method

SftpThread::SftpThread(SftpEventListener *listener,
                       const int request_id)
  : thread_(NULL),
    listener_(listener),
    request_id_(request_id),
    server_hostname_(""),
    server_port_(-1),
    auth_type_(""),
    username_(""),
    password_(""),
    private_key_(""),
    server_sock_(-1),
    session_(NULL),
    sftp_session_(NULL)
{
  fprintf(stderr, "SftpThread::SftpThread\n");
}

SftpThread::~SftpThread()
{
  fprintf(stderr, "SftpThread::~SftpThread\n");
}

void SftpThread::ConnectAndHandshake(const std::string server_hostname,
                                     const int server_port)
{
  fprintf(stderr, "SftpThread::ConnectAndHandshake\n");
  if (!thread_) {
    server_hostname_ = server_hostname;
    server_port_ = server_port;
    pthread_create(&thread_,
                   NULL,
                   &SftpThread::StartConnectAndHandshakeThread,
                   this);
    fprintf(stderr, "SftpThread::ConnectAndHandshake Thread started\n");
  } else {
    listener_->OnErrorOccurred(request_id_, 0, std::string("Thread already running"));
  }
}

void SftpThread::Authenticate(const std::string auth_type,
                              const std::string username,
                              const std::string password,
                              const std::string private_key)
{
  fprintf(stderr, "SftpThread::Authenticate\n");
  if (!thread_) {
    if (!session_) {
      listener_->OnErrorOccurred(request_id_, 0, std::string("Not connected and handshaked"));
      return;
    }
    auth_type_ = auth_type;
    username_ = username;
    password_ = password;
    private_key_ = private_key;
    pthread_create(&thread_,
                   NULL,
                   &SftpThread::StartAuthenticate,
                   this);
    fprintf(stderr, "SftpThread::Authenticate Thread started\n");
  } else {
    listener_->OnErrorOccurred(request_id_, 0, std::string("Thread already running"));
  }
}

std::string SftpThread::GetPassword()
{
  return password_;
}

void SftpThread::ReadDirectory(const std::string path)
{
  fprintf(stderr, "SftpThread::ReadDirectory\n");
  ReadDirectoryCommand *command = new ReadDirectoryCommand(listener_,
                                                           server_sock_,
                                                           session_,
                                                           sftp_session_,
                                                           request_id_,
                                                           path);
  pthread_t thread;
  pthread_create(&thread,
                 NULL,
                 &ReadDirectoryCommand::Start,
                 command);
  fprintf(stderr, "SftpThread::ReadDirectory Thread started\n");
}

void SftpThread::GetMetadata(const std::string path)
{
  fprintf(stderr, "SftpThread::GetMetadata\n");
  GetMetadataCommand *command = new GetMetadataCommand(listener_,
                                                       server_sock_,
                                                       session_,
                                                       sftp_session_,
                                                       request_id_,
                                                       path);
  pthread_t thread;
  pthread_create(&thread,
                 NULL,
                 &GetMetadataCommand::Start,
                 command);
  fprintf(stderr, "SftpThread::GetMetadata Thread started\n");
}

void SftpThread::ReadFile(const std::string path,
                          const libssh2_uint64_t offset,
                          const libssh2_uint64_t length,
                          const unsigned int buffer_size)
{
  fprintf(stderr, "SftpThread::ReadFile\n");
  ReadFileCommand *command = new ReadFileCommand(listener_,
                                                 server_sock_,
                                                 session_,
                                                 sftp_session_,
                                                 request_id_,
                                                 path,
                                                 offset,
                                                 length,
                                                 buffer_size);
  pthread_t thread;
  pthread_create(&thread,
                 NULL,
                 &ReadFileCommand::Start,
                 command);
  fprintf(stderr, "SftpThread::ReadFile Thread started\n");
}

void SftpThread::MakeDirectory(const std::string path)
{
  fprintf(stderr, "SftpThread::MakeDirectory\n");
  MakeDirectoryCommand *command = new MakeDirectoryCommand(listener_,
                                                           server_sock_,
                                                           session_,
                                                           sftp_session_,
                                                           request_id_,
                                                           path);
  pthread_t thread;
  pthread_create(&thread,
                 NULL,
                 &MakeDirectoryCommand::Start,
                 command);
  fprintf(stderr, "SftpThread::MakeDirectory Thread started\n");
}

void SftpThread::DeleteEntry(const std::string path)
{
  fprintf(stderr, "SftpThread::DeleteEntry\n");
  DeleteEntryCommand *command = new DeleteEntryCommand(listener_,
                                                       server_sock_,
                                                       session_,
                                                       sftp_session_,
                                                       request_id_,
                                                       path);
  pthread_t thread;
  pthread_create(&thread,
                 NULL,
                 &DeleteEntryCommand::Start,
                 command);
  fprintf(stderr, "SftpThread::DeleteEntry Thread started\n");
}

void SftpThread::RenameEntry(const std::string source_path, std::string target_path)
{
  fprintf(stderr, "SftpThread::RenameEntry\n");
  RenameEntryCommand *command = new RenameEntryCommand(listener_,
                                                       server_sock_,
                                                       session_,
                                                       sftp_session_,
                                                       request_id_,
                                                       source_path,
                                                       target_path);
  pthread_t thread;
  pthread_create(&thread,
                 NULL,
                 &RenameEntryCommand::Start,
                 command);
  fprintf(stderr, "SftpThread::RenameEntry Thread started\n");
}

void SftpThread::CreateFile(const std::string path)
{
  fprintf(stderr, "SftpThread::CreateFile\n");
  CreateFileCommand *command = new CreateFileCommand(listener_,
                                                     server_sock_,
                                                     session_,
                                                     sftp_session_,
                                                     request_id_,
                                                     path);
  pthread_t thread;
  pthread_create(&thread,
                 NULL,
                 &CreateFileCommand::Start,
                 command);
  fprintf(stderr, "SftpThread::CreateFile Thread started\n");
}

void SftpThread::WriteFile(const std::string path,
                           const libssh2_uint64_t offset,
                           const size_t length,
                           const pp::VarArrayBuffer &buffer)
{
  fprintf(stderr, "SftpThread::WriteFile\n");
  WriteFileCommand *command = new WriteFileCommand(listener_,
                                                   server_sock_,
                                                   session_,
                                                   sftp_session_,
                                                   request_id_,
                                                   path,
                                                   offset,
                                                   length,
                                                   buffer);
  pthread_t thread;
  pthread_create(&thread,
                 NULL,
                 &WriteFileCommand::Start,
                 command);
  fprintf(stderr, "SftpThread::WriteFile Thread started\n");
}

void SftpThread::TruncateFile(const std::string path,
                              const libssh2_uint64_t length)
{
  fprintf(stderr, "SftpThread::TruncateFile\n");
  TruncateFileCommand *command = new TruncateFileCommand(listener_,
                                                         server_sock_,
                                                         session_,
                                                         sftp_session_,
                                                         request_id_,
                                                         path,
                                                         length);
  pthread_t thread;
  pthread_create(&thread,
                 NULL,
                 &TruncateFileCommand::Start,
                 command);
  fprintf(stderr, "SftpThread::TruncateFile Thread started\n");
}

void SftpThread::Close()
{
  fprintf(stderr, "SftpThread::Close\n");
  if (!thread_) {
    pthread_create(&thread_,
                   NULL,
                   &SftpThread::StartClose,
                   this);
    fprintf(stderr, "SftpThread::Close Thread started\n");
  } else {
    listener_->OnErrorOccurred(request_id_, 0, std::string("Thread already running"));
  }
}

// --- Private method

// ----- Connection and handshaking

void* SftpThread::StartConnectAndHandshakeThread(void *arg)
{
  SftpThread *instance = static_cast<SftpThread*>(arg);
  instance->ConnectAndHandshakeImpl();
  return NULL;
}

void SftpThread::ConnectAndHandshakeImpl()
{
  fprintf(stderr, "SftpThread::ConnectAndHandshakeImpl\n");
  if (session_) {
    fprintf(stderr, "SftpThread::ConnectAndHandshakeImpl Close already opened session\n");
    CloseSession(session_);
    close(server_sock_);
    server_sock_ = -1;
    session_ = NULL;
    fprintf(stderr, "SftpThread::ConnectAndHandshakeImpl Closing session completed\n");
  }
  int sock = 1;
  LIBSSH2_SESSION *session = NULL;
  try {
    InitializeLibssh2();
    sock = ConnectToSshServer(server_hostname_, server_port_);
    session = InitializeSession();
    SetKEXMethodPrefs(session);
    HandshakeSession(session, sock);
    std::string fingerprint;
    fingerprint = GetHostKeyHash(session);
    std::string hostkey_method;
    hostkey_method = GetHostKeyMethod(session);
    server_sock_ = sock;
    session_ = session;
    thread_ = NULL;
    listener_->OnHandshakeFinished(request_id_, fingerprint, hostkey_method);
  } catch (CommunicationException &e) {
    std::string msg;
    msg = e.toString();
    CloseSession(session);
    close(sock);
    server_sock_ = -1;
    session_ = NULL;
    thread_ = NULL;
    listener_->OnErrorOccurred(request_id_, e.getResultCode(), msg);
  }
  fprintf(stderr, "SftpThread::ConnectAndHandshakeImpl End\n");
}

void SftpThread::InitializeLibssh2() throw(CommunicationException)
{
  fprintf(stderr, "SftpThread::InitializeLibssh2\n");
  int rc;
  rc = libssh2_init(0);
  fprintf(stderr, "SftpThread::InitializeLibssh2 rc=%d\n", rc);
  if (rc != 0) {
    THROW_COMMUNICATION_EXCEPTION("sftpThreadError_initFailed", rc);
  }
}

int SftpThread::ConnectToSshServer(const std::string &hostname, const int port)
  throw(CommunicationException)
{
  fprintf(stderr, "SftpThread::ConnectToSshServer\n");
  struct hostent *hostent;
  hostent = gethostbyname(hostname.c_str());
  if (hostent == NULL) {
    fprintf(stderr, "SftpThread::ConnectToSshServer hostent is NULL\n");
    THROW_COMMUNICATION_EXCEPTION("sftpThreadError_hostentIsNull", errno);
  }
  int sock;
  sock = socket(PF_INET, SOCK_STREAM, IPPROTO_TCP);
  fprintf(stderr, "SftpThread::ConnectToSshServer sock=%d\n", sock);
  struct sockaddr_in sin;
  sin.sin_family = AF_INET;
  sin.sin_port = htons(port);
  memcpy(&sin.sin_addr.s_addr, hostent->h_addr_list[0], hostent->h_length);
  memset(&sin.sin_zero, 0, sizeof(sin.sin_zero));
  fprintf(stderr, "SftpThread::ConnectToSshServer sockaddr_in ready\n");
  int rc;
  rc = connect(sock, (struct sockaddr*)(&sin), sizeof(struct sockaddr_in));
  fprintf(stderr, "SftpThread::ConnectToSshServer rc=%d\n", rc);
  if (rc != 0) {
    THROW_COMMUNICATION_EXCEPTION("sftpThreadError_connectFailed", rc);
  }
  return sock;
}

LIBSSH2_SESSION* SftpThread::InitializeSession() throw(CommunicationException)
{
  fprintf(stderr, "SftpThread::InitializeSession\n");
  LIBSSH2_SESSION *session;
  session = libssh2_session_init_ex(NULL, NULL, NULL, this);
  if (!session) {
    fprintf(stderr, "SftpThread::InitializeSession Initializing session failed\n");
    THROW_COMMUNICATION_EXCEPTION("sftpThreadError_sshInitSessionFailed", 0);
  }
  fprintf(stderr, "SftpThread::InitializeSession Initialized session \n");
  return session;
}

void SftpThread::SetKEXMethodPrefs(LIBSSH2_SESSION *session)
  throw(CommunicationException)
{
  fprintf(stderr, "SftpThread::SetKEXMethodPrefs\n");
  const char *methods;
  methods = "curve25519-sha256,curve25519-sha256@libssh.org,ecdh-sha2-nistp256,ecdh-sha2-nistp384,ecdh-sha2-nistp521,diffie-hellman-group-exchange-sha256,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512,diffie-hellman-group14-sha256";
  int rc;
  while ((rc = libssh2_session_method_pref(session, LIBSSH2_METHOD_HOSTKEY, methods)) == LIBSSH2_ERROR_EAGAIN);
  fprintf(stderr, "SftpThread::SetKEXMethodPrefs rc=%d\n", rc);
  if (rc) {
    THROW_COMMUNICATION_EXCEPTION("sftpThreadError_sshKEXMethodPrefsFailed", rc);
  }
}

void SftpThread::HandshakeSession(LIBSSH2_SESSION *session, int sock)
  throw(CommunicationException)
{
  fprintf(stderr, "SftpThread::HandshakeSession\n");
  int rc;
  while ((rc = libssh2_session_handshake(session, sock)) == LIBSSH2_ERROR_EAGAIN);
  fprintf(stderr, "SftpThread::HandshakeSession rc=%d\n", rc);
  if (rc) {
    THROW_COMMUNICATION_EXCEPTION("sftpThreadError_sshSessionHandshakeFailed", rc);
  }
}

std::string SftpThread::GetHostKeyHash(LIBSSH2_SESSION *session)
{
  fprintf(stderr, "SftpThread::GetHostKeyHash\n");
  const char *fingerprint;
  fingerprint = libssh2_hostkey_hash(session, LIBSSH2_HOSTKEY_HASH_MD5);
  std::ostringstream oss;
  oss.fill('0');
  int i;
  for (i = 0; i < 16; i++) {
    oss << std::setw(2) << std::hex << ((unsigned int)fingerprint[i] & 0xFF);
  }
  std::string result = oss.str();
  fprintf(stderr, "SftpThread::GetHostKeyHash hash=%s\n", result.c_str());
  return result;
}

std::string SftpThread::GetHostKeyMethod(LIBSSH2_SESSION *session)
{
  fprintf(stderr, "SftpThread::GetHostKeyMethod\n");
  const char *method = libssh2_session_methods(session, LIBSSH2_METHOD_HOSTKEY);
  std::string result = method;
  fprintf(stderr, "SftpThread::GetHostKeyMethod method=%s\n", result.c_str());
  return result;
}

// ----- Authentication

void* SftpThread::StartAuthenticate(void *arg)
{
  SftpThread *instance = static_cast<SftpThread*>(arg);
  instance->AuthenticateImpl();
  return NULL;
}

void SftpThread::AuthenticateImpl()
{
  fprintf(stderr, "SftpThread::AuthenticateImpl\n");
  try {
    AuthenticateUser();
    SetNonBlocking(session_);
    sftp_session_ = OpenSftpSession(session_);
    thread_ = NULL;
    listener_->OnAuthenticationFinished(request_id_);
  } catch(CommunicationException e) {
    std::string msg;
    msg = e.toString();
    thread_ = NULL;
    listener_->OnErrorOccurred(request_id_, e.getResultCode(), msg);
  }
  fprintf(stderr, "SftpThread::AuthenticateImpl End\n");
}

void SftpThread::AuthenticateUser() throw(CommunicationException)
{
  fprintf(stderr, "SftpThread::AuthenticateUser\n");
  char *user_auth_list;
  user_auth_list = libssh2_userauth_list(session_, username_.c_str(), strlen(username_.c_str()));
  fprintf(stderr, "SftpThread::AuthenticateUser auth_list=%s\n", user_auth_list);
  if (auth_type_ == "password") {
    if (strstr(user_auth_list, auth_type_.c_str())) {
      AuthenticateByPassword(session_, username_, password_);
    } else {
      THROW_COMMUNICATION_EXCEPTION("sftpThreadError_unsupportedAuthTypePassword", 0);
    }
  } else if (auth_type_ == "keyboard-interactive") {
    if (strstr(user_auth_list, auth_type_.c_str())) {
      AuthenticateByKeyboardInteractive(session_, username_, password_);
    } else {
      THROW_COMMUNICATION_EXCEPTION("sftpThreadError_unsupportedAuthTypeKeyboardInteractive", 0);
    }
  } else if (auth_type_ == "publickey") {
    if (strstr(user_auth_list, auth_type_.c_str())) {
      AuthenticateByPublicKey(session_, username_, password_, private_key_);
    } else {
      THROW_COMMUNICATION_EXCEPTION("sftpThreadError_unsupportedAuthTypePublicKey", 0);
    }
  } else {
    THROW_COMMUNICATION_EXCEPTION("sftpThreadError_unknownAuthType", 0);
  }
}

void SftpThread::AuthenticateByPassword(LIBSSH2_SESSION *session,
                                        const std::string &username,
                                        const std::string &password)
  throw(CommunicationException)
{
  fprintf(stderr, "SftpThread::AuthenticateByPassword\n");
  int rc = -1;
  while((rc = libssh2_userauth_password(session,
                                        username.c_str(),
                                        password.c_str())) == LIBSSH2_ERROR_EAGAIN);
  fprintf(stderr, "SftpThread::AuthenticateByPassword rc=%d\n", rc);
  if (rc) {
    THROW_COMMUNICATION_EXCEPTION("sftpThreadError_failedAuthenticationPassword", rc);
  }
}

void SftpThread::AuthenticateByKeyboardInteractive(LIBSSH2_SESSION *session,
                                                   const std::string &username,
                                                   const std::string &password)
  throw(CommunicationException)
{
  fprintf(stderr, "SftpThread::AuthenticateByKeyboardInteractive\n");
  int rc = -1;
  auto callback = &SftpThread::KeyboardCallback;
  while((rc = libssh2_userauth_keyboard_interactive(session,
                                                    username.c_str(),
                                                    callback)) == LIBSSH2_ERROR_EAGAIN);
  fprintf(stderr, "SftpThread::AuthenticateByKeyboardInteractive rc=%d\n", rc);
  if (rc) {
    THROW_COMMUNICATION_EXCEPTION("sftpThreadError_failedAuthenticationKeyboardInteractive", rc);
  }
}

void SftpThread::KeyboardCallback(const char *name,
                                  int name_len,
                                  const char *instruction,
                                  int instruction_len,
                                  int num_prompts,
                                  const LIBSSH2_USERAUTH_KBDINT_PROMPT *prompts,
                                  LIBSSH2_USERAUTH_KBDINT_RESPONSE *response,
                                  void **abstract)
{
  (void)name;
  (void)name_len;
  (void)instruction;
  (void)instruction_len;
  SftpThread *thread = (SftpThread*)*abstract;
  const std::string &password = thread->GetPassword();
  if (num_prompts == 1) {
    response[0].text = const_cast<char*>(password.c_str());
    response[0].length = strlen(password.c_str());
  }
  (void)prompts;
  (void)abstract;
}

void SftpThread::AuthenticateByPublicKey(LIBSSH2_SESSION *session,
                                         const std::string &username,
                                         const std::string &password,
                                         const std::string &private_key)
  throw(CommunicationException)
{
  fprintf(stderr, "SftpThread::AuthenticateByPublicKey\n");

  int rc = -1;
  size_t len;

  FILE *f;
  f = fopen("/sftp/private_key", "w");
  if (f) {
    len = strlen(private_key.c_str());
    fwrite(private_key.c_str(), 1, len, f);
    fclose(f);
  } else {
    fclose(f);
    THROW_COMMUNICATION_EXCEPTION("sftpThreadError_storingPrivateKeyFailed", rc);
  }

  while((rc = libssh2_userauth_publickey_fromfile(session,
                                                  username.c_str(),
                                                  NULL,
                                                  "/sftp/private_key",
                                                  password.c_str())) == LIBSSH2_ERROR_EAGAIN);
  fprintf(stderr, "SftpThread::AuthenticateByPublicKey rc=%d\n", rc);
  if (rc) {
    char *err_msg;
    libssh2_session_last_error(session, &err_msg, NULL, 0);
    THROW_COMMUNICATION_EXCEPTION(err_msg, rc);
  }
}

void SftpThread::SetNonBlocking(LIBSSH2_SESSION *session)
{
  fprintf(stderr, "SftpThread::SetNonBlocking\n");
  libssh2_session_set_blocking(session, 0);
  fprintf(stderr, "SftpThread::SetNonBlocking End\n");
}

LIBSSH2_SFTP* SftpThread::OpenSftpSession(LIBSSH2_SESSION *session) throw(CommunicationException)
{
  fprintf(stderr, "SftpThread::OpenSftpSession\n");
  LIBSSH2_SFTP *sftp_session = NULL;
  do {
    sftp_session = libssh2_sftp_init(session);
    int last_error_no = libssh2_session_last_errno(session);
    fprintf(stderr, "SftpThread::OpenSftpSession errno=%d\n", last_error_no);
    if (!sftp_session) {
      if (last_error_no == LIBSSH2_ERROR_EAGAIN) {
        WaitSocket(server_sock_, session);
      } else {
        THROW_COMMUNICATION_EXCEPTION("sftpThreadError_sftpSessionInitFailed", last_error_no);
      }
    }
  } while (!sftp_session);
  fprintf(stderr, "SftpThread::OpenSftpSession End\n");
  return sftp_session;
}

int SftpThread::WaitSocket(int socket_fd, LIBSSH2_SESSION *session)
{
  struct timeval timeout;
  int rc;
  fd_set fd;
  fd_set *writefd = NULL;
  fd_set *readfd = NULL;
  int dir;
  timeout.tv_sec = 10;
  timeout.tv_usec = 0;
  FD_ZERO(&fd);
  FD_SET(socket_fd, &fd);
  dir = libssh2_session_block_directions(session);
  if (dir & LIBSSH2_SESSION_BLOCK_INBOUND) {
    readfd = &fd;
  }
  if (dir & LIBSSH2_SESSION_BLOCK_OUTBOUND) {
    writefd = &fd;
  }
  rc = select(socket_fd + 1, readfd, writefd, NULL, &timeout);
  return rc;
}

// ----- Close

void SftpThread::CloseSession(LIBSSH2_SESSION *session)
{
  fprintf(stderr, "SftpThread::CloseSession\n");
  if (session) {
    int rc = -1;
    do {
      rc = libssh2_session_disconnect(session, "Client disconnecting normally");
      if (rc == LIBSSH2_ERROR_EAGAIN) {
        WaitSocket(server_sock_, session);
      }
    } while (rc == LIBSSH2_ERROR_EAGAIN);
    fprintf(stderr, "SftpThread::CloseSession 1 rc=%d\n", rc);
    if (rc < 0) {
      THROW_COMMUNICATION_EXCEPTION("sftpThreadError_sshCloseSessionFailed", rc);
    }
    do {
      rc = libssh2_session_free(session);
      if (rc == LIBSSH2_ERROR_EAGAIN) {
        WaitSocket(server_sock_, session);
      }
    } while (rc == LIBSSH2_ERROR_EAGAIN);
    fprintf(stderr, "SftpThread::CloseSession 2 rc=%d\n", rc);
    if (rc < 0) {
      THROW_COMMUNICATION_EXCEPTION("sftpThreadError_sshCloseSessionFailedClearResources", rc);
    }
  }
}

void SftpThread::CloseSftpSession(LIBSSH2_SFTP *sftp_session)
{
  fprintf(stderr, "SftpThread::CloseSftpSession\n");
  if (sftp_session) {
    int rc = -1;
    do {
      rc = libssh2_sftp_shutdown(sftp_session);
      if (rc == LIBSSH2_ERROR_EAGAIN) {
        WaitSocket(server_sock_, session_);
      }
    } while (rc == LIBSSH2_ERROR_EAGAIN);
    fprintf(stderr, "SftpThread::CloseSftpSession rc=%d\n", rc);
    if (rc < 0) {
      THROW_COMMUNICATION_EXCEPTION("sftpThreadError_sftpCloseFailed", rc);
    }
  }
}

void* SftpThread::StartClose(void *arg)
{
  SftpThread *instance = static_cast<SftpThread*>(arg);
  instance->CloseImpl();
  return NULL;
}

void SftpThread::CloseImpl()
{
  fprintf(stderr, "SftpThread::CloseImpl\n");
  CloseSftpSession(sftp_session_);
  CloseSession(session_);
  close(server_sock_);
  server_sock_ = -1;
  session_ = NULL;
  thread_ = NULL;
  listener_->OnShutdown(request_id_);
}
