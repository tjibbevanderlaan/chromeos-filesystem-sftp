#include <cstdio>
#include <errno.h>
#include <sys/mount.h>

#include "nacl_io/nacl_io.h"
#include "ppapi/cpp/var_dictionary.h"
#include "ppapi/cpp/var_array.h"

#include "sftp.h"

// clss SftpInstance

SftpInstance::SftpInstance(PP_Instance instance)
  : pp::Instance(instance),
    pp_core_(pp::Module::Get()->core()),
    factory_(this)
{
  fprintf(stderr, "SftpInstance::SftpInstance\n");
  nacl_io_init_ppapi(instance, pp::Module::Get()->get_browser_interface());
  mount("", "/sftp", "memfs", 0, "");
  fprintf(stderr, "SftpInstance::SftpInstance End\n");
}

SftpInstance::~SftpInstance()
{
  fprintf(stderr, "SftpInstance::~SftpInstance\n");
}

void SftpInstance::HandleMessage(const pp::Var &var_message)
{
  fprintf(stderr, "SftpInstance::HandleMessage\n");
  if (!var_message.is_dictionary()) {
    return;
  }

  pp::VarDictionary dict(var_message);
  std::string command = dict.Get("command").AsString();
  int request_id = GetIntegerValueFromString(dict.Get("request").AsString());
  fprintf(stderr, "SftpInstance::HandleMessage %s %d\n", command.c_str(), request_id);

  SftpThread *sftp_thread;
  if (sftp_thread_map_.find(request_id) == sftp_thread_map_.end()) {
    sftp_thread = new SftpThread(this, request_id);
    sftp_thread_map_[request_id] = sftp_thread;
    fprintf(stderr, "SftpInstance::HandleMessage SftpThread instance created\n");
  } else {
    sftp_thread = sftp_thread_map_[request_id];
    fprintf(stderr, "SftpInstance::HandleMessage Re-use SftpThread instance\n");
  }
  pp::VarArray args(dict.Get("args"));
  if (command == "connect") {
    std::string server_hostname = args.Get(0).AsString();
    int server_port = GetIntegerValueFromString(args.Get(1).AsString());
    sftp_thread->ConnectAndHandshake(server_hostname,
                                     server_port);
  } else if (command == "authenticate") {
    std::string auth_type = args.Get(0).AsString();
    std::string username = args.Get(1).AsString();
    std::string password = args.Get(2).AsString();
    std::string private_key  = args.Get(3).AsString();
    sftp_thread->Authenticate(auth_type,
                              username,
                              password,
                              private_key);
  } else if (command == "dir") {
    std::string path = args.Get(0).AsString();
    sftp_thread->ReadDirectory(path);
  } else if (command == "file") {
    std::string path = args.Get(0).AsString();
    sftp_thread->GetMetadata(path);
  } else if (command == "read") {
    std::string path = args.Get(0).AsString();
    libssh2_uint64_t offset = GetUint64ValueFromString(args.Get(1).AsString());
    libssh2_uint64_t length = GetUint64ValueFromString(args.Get(2).AsString());
    int buffer_size = GetIntegerValueFromString(args.Get(3).AsString());
    sftp_thread->ReadFile(path, offset, length, buffer_size);
  } else if (command == "mkdir") {
    std::string path = args.Get(0).AsString();
    sftp_thread->MakeDirectory(path);
  } else if (command == "delete") {
    std::string path = args.Get(0).AsString();
    sftp_thread->DeleteEntry(path);
  } else if (command == "rename") {
    std::string source_path = args.Get(0).AsString();
    std::string target_path = args.Get(1).AsString();
    sftp_thread->RenameEntry(source_path, target_path);
  } else if (command == "create") {
    std::string path = args.Get(0).AsString();
    sftp_thread->CreateFile(path);
  } else if (command == "write") {
    std::string path = args.Get(0).AsString();
    libssh2_uint64_t offset = GetUint64ValueFromString(args.Get(1).AsString());
    size_t length = GetSizeValueFromString(args.Get(2).AsString());
    pp::VarArrayBuffer data(args.Get(3));
    sftp_thread->WriteFile(path, offset, length, data);
  } else if (command == "truncate") {
    std::string path = args.Get(0).AsString();
    libssh2_uint64_t length = GetUint64ValueFromString(args.Get(1).AsString());
    sftp_thread->TruncateFile(path, length);
  } else if (command == "close") {
    sftp_thread->Close();
  } else if (command == "destroy") {
    // Terminate immediately
    fprintf(stderr, "SftpInstance::HandleMessage exit(0)\n");
    exit(0);
  }
  fprintf(stderr, "SftpInstance::HandleMessage End\n");
}

int SftpInstance::GetIntegerValueFromString(const std::string &source)
{
  int result;
  sscanf(source.c_str(), "%d", &result);
  return result;
}

libssh2_uint64_t SftpInstance::GetUint64ValueFromString(const std::string &source)
{
  libssh2_uint64_t result;
  sscanf(source.c_str(), "%llu", &result);
  return result;
}

size_t SftpInstance::GetSizeValueFromString(const std::string &source)
{
  size_t result;
  sscanf(source.c_str(), "%d", &result);
  return result;
}

void SftpInstance::OnHandshakeFinished(const int request_id,
                                       const std::string &fingerprint,
                                       const std::string &hostkey_method)
{
  fprintf(stderr, "SftpInstance::OnHandshakeFinished\n");
  SendResponse(request_id,
               std::string("fingerprint"),
               std::vector<std::string>{fingerprint, hostkey_method});
}

void SftpInstance::OnAuthenticationFinished(const int request_id)
{
  fprintf(stderr, "SftpInstance::OnAuthenticationFinished\n");
  SendResponse(request_id, std::string("authenticated"), std::vector<std::string>{});
}

void SftpInstance::OnShutdown(const int request_id)
{
  fprintf(stderr, "SftpInstance::OnShutdown\n");
  SendResponse(request_id, std::string("shutdown"), std::vector<std::string>{});
  if (sftp_thread_map_.find(request_id) != sftp_thread_map_.end()) {
    SftpThread *sftp_thread = sftp_thread_map_[request_id];
    sftp_thread_map_.erase(request_id);
    delete sftp_thread;
  }
}

void SftpInstance::OnErrorOccurred(const int request_id, const int result_code, const std::string &message)
{
  fprintf(stderr, "SftpInstance::OnErrorOccurred\n");
  pp::VarDictionary obj;
  obj.Set(pp::Var("message"), pp::Var(message));
  obj.Set(pp::Var("result_code"), pp::Var(result_code));
  SendResponse(request_id, std::string("error"), obj);
}

void SftpInstance::OnMetadataListFetched(const int request_id,
                                         const std::vector<pp::Var> &metadataList)
{
  fprintf(stderr, "SftpInstance::OnMetadataListFetched\n");
  SendResponse(request_id, std::string("metadataList"), metadataList);
}

void SftpInstance::OnReadFile(const int request_id,
                              const pp::VarArrayBuffer &buffer,
                              const int length,
                              const bool has_more)
{
  fprintf(stderr, "SftpInstance::OnReadFile\n");
  pp::VarDictionary obj;
  obj.Set(pp::Var("data"), buffer);
  obj.Set(pp::Var("length"), pp::Var(length));
  obj.Set(pp::Var("hasMore"), pp::Var(has_more));
  SendResponse(request_id, std::string("readFile"), obj);
}

void SftpInstance::OnMakeDirectoryFinished(const int request_id)
{
  fprintf(stderr, "SftpInstance::OnMakeDirectoryFinished\n");
  SendResponse(request_id, std::string("mkdirSuccessful"), std::vector<std::string>{});
}

void SftpInstance::OnDeleteEntryFinished(const int request_id)
{
  fprintf(stderr, "SftpInstance::OnDeleteEntryFinished\n");
  SendResponse(request_id, std::string("deleteSuccessful"), std::vector<std::string>{});
}

void SftpInstance::OnRenameEntryFinished(const int request_id)
{
  fprintf(stderr, "SftpInstance::OnRenameEntryFinished\n");
  SendResponse(request_id, std::string("renameSuccessful"), std::vector<std::string>{});
}

void SftpInstance::OnCreateFileFinished(const int request_id)
{
  fprintf(stderr, "SftpInstance::OnCreateFileFinished\n");
  SendResponse(request_id, std::string("createSuccessful"), std::vector<std::string>{});
}

void SftpInstance::OnWriteFileFinished(const int request_id)
{
  fprintf(stderr, "SftpInstance::OnWriteFileFinished\n");
  SendResponse(request_id, std::string("writeSuccessful"), std::vector<std::string>{});
}

void SftpInstance::OnTruncateFileFinished(const int request_id)
{
  fprintf(stderr, "SftpInstance::OnTruncateFileFinished\n");
  SendResponse(request_id, std::string("truncateSuccessful"), std::vector<std::string>{});
}

void SftpInstance::SendResponse(const int request_id,
                                const std::string &message,
                                const std::vector<std::string> &values)
{
  pp::CompletionCallback callback =
    factory_.NewCallback(&SftpInstance::SendResponseAsStringArray,
                         request_id,
                         message,
                         values);
  pp_core_->CallOnMainThread(0, callback);
}

void SftpInstance::SendResponse(const int request_id,
                                const std::string &message,
                                const std::vector<pp::Var> &values)
{
  pp::CompletionCallback callback =
    factory_.NewCallback(&SftpInstance::SendResponseAsJsonObjectArray,
                         request_id,
                         message,
                         values);
  pp_core_->CallOnMainThread(0, callback);
}

void SftpInstance::SendResponse(const int request_id,
                                const std::string &message,
                                const pp::VarDictionary &value)
{
  pp::CompletionCallback callback =
    factory_.NewCallback(&SftpInstance::SendResponseAsJsonObject,
                         request_id,
                         message,
                         value);
  pp_core_->CallOnMainThread(0, callback);
}

void SftpInstance::SendResponseAsStringArray(int32_t result,
                                             const int request_id,
                                             const std::string &message,
                                             const std::vector<std::string> &values)
{
  fprintf(stderr, "SftpInstance::SendResponseAsStringArray\n");
  pp::VarDictionary dict;
  dict.Set(pp::Var("request"), pp::Var(request_id));
  dict.Set(pp::Var("message"), pp::Var(message));
  pp::VarArray args;
  int cnt = 0;
  std::vector<std::string>::const_iterator i;
  for (i = values.begin(); i != values.end(); ++i) {
    std::string value = *i;
    args.Set(cnt, pp::Var(value));
    cnt++;
  }
  dict.Set(pp::Var("values"), args);
  PostMessage(dict);
  fprintf(stderr, "SftpInstance::SendResponseAsStringArray End\n");
}

void SftpInstance::SendResponseAsJsonObjectArray(int32_t result,
                                                 const int request_id,
                                                 const std::string &message,
                                                 const std::vector<pp::Var> &values)
{
  fprintf(stderr, "SftpInstance::SendResponseAsJsonObjectArray\n");
  pp::VarDictionary root;
  root.Set(pp::Var("request"), pp::Var(request_id));
  root.Set(pp::Var("message"), pp::Var(message));
  pp::VarArray args;
  std::vector<pp::Var>::const_iterator i;
  int cnt = 0;
  for (i = values.begin(); i != values.end(); ++i) {
    pp::Var value = *i;
    args.Set(cnt, value);
    cnt++;
  }
  root.Set(pp::Var("values"), args);
  PostMessage(root);
  fprintf(stderr, "SftpInstance::SendResponseAsJsonObjectArray End\n");
}

void SftpInstance::SendResponseAsJsonObject(int32_t result,
                                            const int request_id,
                                            const std::string &message,
                                            const pp::VarDictionary &value)
{
  fprintf(stderr, "SftpInstance::SendResponseAsJsonObject\n");
  pp::VarDictionary root;
  root.Set(pp::Var("request"), pp::Var(request_id));
  root.Set(pp::Var("message"), pp::Var(message));
  root.Set(pp::Var("value"), value);
  PostMessage(root);
  fprintf(stderr, "SftpInstance::SendResponseAsJsonObject End\n");
}

// class SftpModule

SftpModule::SftpModule()
  : pp::Module()
{
}

SftpModule::~SftpModule()
{
}

pp::Instance* SftpModule::CreateInstance(PP_Instance instance)
{
  return new SftpInstance(instance);
}
