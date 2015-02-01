#include <cstdio>
#include <errno.h>
#include <sys/mount.h>


#include "nacl_io/nacl_io.h"

#include "sftp.h"

// clss SftpInstance

SftpInstance::SftpInstance(PP_Instance instance)
  : pp::Instance(instance),
    pp_core_(pp::Module::Get()->core()),
    factory_(this)
{
  nacl_io_init_ppapi(instance, pp::Module::Get()->get_browser_interface());
  mount("", "/sftp", "memfs", 0, "");
  //sftp_thread_ = new SftpThread(this, this);
}

SftpInstance::~SftpInstance()
{
}

void SftpInstance::HandleMessage(const pp::Var &var_message)
{
  if (!var_message.is_string()) {
    return;
  }

  Json::Value root;
  if (Json::Reader().parse(var_message.AsString(), root) &&
      root.isObject()) {
    std::string command = root["command"].asString();
    int request_id = GetIntegerValueFromString(root["request"].asString());
    SftpThread *sftp_thread;
    if (sftp_thread_map_.find(request_id) == sftp_thread_map_.end()) {
      sftp_thread = new SftpThread(this, this, request_id);
      sftp_thread_map_[request_id] = sftp_thread;
    } else {
      sftp_thread = sftp_thread_map_[request_id];
    }
    const Json::Value &args = root["args"];
    if (!command.empty() && args.isArray()) {
      if (command == "connect") {
        std::string server_hostname = args[0].asString();
        int server_port = GetIntegerValueFromString(args[1].asString());
        sftp_thread->ConnectAndHandshake(server_hostname,
                                         server_port);
      } else if (command == "authenticate") {
        std::string auth_type = args[0].asString();
        std::string username = args[1].asString();
        std::string password = args[2].asString();
        std::string private_key  = args[3].asString();
        sftp_thread->Authenticate(auth_type,
                                  username,
                                  password,
                                  private_key);
      } else if (command == "dir") {
        std::string path = args[0].asString();
        sftp_thread->ReadDirectory(path);
      } else if (command == "file") {
        std::string path = args[0].asString();
        sftp_thread->GetMetadata(path);
      } else if (command == "read") {
        std::string path = args[0].asString();
        libssh2_uint64_t offset = GetUint64ValueFromString(args[1].asString());
        libssh2_uint64_t length = GetUint64ValueFromString(args[2].asString());
        sftp_thread->ReadFile(path, offset, length);
      } else if (command == "mkdir") {
        std::string path = args[0].asString();
        sftp_thread->MakeDirectory(path);
      } else if (command == "delete") {
        std::string path = args[0].asString();
        sftp_thread->DeleteEntry(path);
      } else if (command == "rename") {
        std::string source_path = args[0].asString();
        std::string target_path = args[1].asString();
        sftp_thread->RenameEntry(source_path, target_path);
      } else if (command == "create") {
        std::string path = args[0].asString();
        sftp_thread->CreateFile(path);
      } else if (command == "write") {
        std::string path = args[0].asString();
        libssh2_uint64_t offset = GetUint64ValueFromString(args[1].asString());
        libssh2_uint64_t length = GetUint64ValueFromString(args[2].asString());
        std::string b64Data = args[3].asString();
        sftp_thread->WriteFile(path, offset, length, b64Data);
      } else if (command == "truncate") {
        std::string path = args[0].asString();
        libssh2_uint64_t length = GetUint64ValueFromString(args[1].asString());
        sftp_thread->TruncateFile(path, length);
      } else if (command == "close") {
        sftp_thread->Close();
        sftp_thread_map_.erase(request_id);
        delete sftp_thread;
      }
    }
  }
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

void SftpInstance::OnHandshakeFinished(const int request_id,
                                       const std::string &fingerprint,
                                       const std::string &hostkey_method)
{
  SendResponse(request_id,
               std::string("fingerprint"),
               std::vector<std::string>{fingerprint, hostkey_method});
}

void SftpInstance::OnAuthenticationFinished(const int request_id)
{
  SendResponse(request_id, std::string("authenticated"), std::vector<std::string>{});
}

void SftpInstance::OnShutdown(const int request_id)
{
  SendResponse(request_id, std::string("shutdown"), std::vector<std::string>{});
}

void SftpInstance::OnErrorOccurred(const int request_id, const std::string &message)
{
  SendResponse(request_id, std::string("error"), std::vector<std::string>{message});
}

void SftpInstance::OnMetadataListFetched(const int request_id,
                                         const std::vector<Json::Value> &metadataList)
{
  SendResponse(request_id, std::string("metadataList"), metadataList);
}

void SftpInstance::OnReadFile(const int request_id,
                              const std::string &b64_data,
                              const int length,
                              const bool has_more)
{
  Json::Value obj;
  obj["b64Data"] = b64_data;
  obj["length"] = length;
  obj["hasMore"] = has_more;
  SendResponse(request_id, std::string("readFile"), obj);
}

void SftpInstance::OnMakeDirectoryFinished(const int request_id)
{
  SendResponse(request_id, std::string("mkdirSuccessful"), std::vector<std::string>{});
}

void SftpInstance::OnDeleteEntryFinished(const int request_id)
{
  SendResponse(request_id, std::string("deleteSuccessful"), std::vector<std::string>{});
}

void SftpInstance::OnRenameEntryFinished(const int request_id)
{
  SendResponse(request_id, std::string("renameSuccessful"), std::vector<std::string>{});
}

void SftpInstance::OnCreateFileFinished(const int request_id)
{
  SendResponse(request_id, std::string("createSuccessful"), std::vector<std::string>{});
}

void SftpInstance::OnWriteFileFinished(const int request_id)
{
  SendResponse(request_id, std::string("writeSuccessful"), std::vector<std::string>{});
}

void SftpInstance::OnTruncateFileFinished(const int request_id)
{
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
                                const std::vector<Json::Value> &values)
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
                                const Json::Value &value)
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
  Json::Value root(Json::objectValue);
  root["request"] = request_id;
  root["message"] = message;
  Json::Value json_values(Json::arrayValue);
  std::vector<std::string>::const_iterator i;
  for (i = values.begin(); i != values.end(); ++i) {
    std::string value = *i;
    json_values.append(value);
  }
  root["values"] = json_values;

  Json::FastWriter writer;
  std::string json = writer.write(root);
  PostMessage(pp::Var(json));
}

void SftpInstance::SendResponseAsJsonObjectArray(int32_t result,
                                                 const int request_id,
                                                 const std::string &message,
                                                 const std::vector<Json::Value> &values)
{
  Json::Value root(Json::objectValue);
  root["request"] = request_id;
  root["message"] = message;
  Json::Value json_values(Json::arrayValue);
  std::vector<Json::Value>::const_iterator i;
  for (i = values.begin(); i != values.end(); ++i) {
    Json::Value value = *i;
    json_values.append(value);
  }
  root["values"] = json_values;

  Json::FastWriter writer;
  std::string json = writer.write(root);
  PostMessage(pp::Var(json));
}

void SftpInstance::SendResponseAsJsonObject(int32_t result,
                                            const int request_id,
                                            const std::string &message,
                                            const Json::Value &value)
{
  Json::Value root(Json::objectValue);
  root["request"] = request_id;
  root["message"] = message;
  root["value"] = value;

  Json::FastWriter writer;
  std::string json = writer.write(root);
  PostMessage(pp::Var(json));
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
