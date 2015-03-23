#ifndef SFTP_H
#define SFTP_H

#include <map>

#include "ppapi/utility/completion_callback_factory.h"
#include "ppapi/cpp/instance.h"
#include "ppapi/cpp/module.h"
#include "ppapi/cpp/var.h"
#include "ppapi/cpp/var_dictionary.h"
#include "ppapi/cpp/var_array.h"
#include "ppapi/cpp/var_array_buffer.h"

#include "sftp_thread.h"
#include "sftp_event_listener.h"

class SftpInstance : public pp::Instance, public SftpEventListener
{

 public:

  explicit SftpInstance(PP_Instance instance);
  virtual ~SftpInstance();

  virtual void HandleMessage(const pp::Var &var_message);

  virtual void OnHandshakeFinished(const int request_id,
                                   const std::string &fingerprint,
                                   const std::string &hostkey_method);
  virtual void OnAuthenticationFinished(const int request_id);
  virtual void OnShutdown(const int request_id);
  virtual void OnErrorOccurred(const int request_id,const std::string &message);
  virtual void OnMetadataListFetched(const int request_id,
                                     const std::vector<pp::Var> &metadataList);
  virtual void OnReadFile(const int request_id,
                          const pp::VarArrayBuffer &buffer,
                          const int length,
                          const bool has_more);
  virtual void OnMakeDirectoryFinished(const int request_id);
  virtual void OnDeleteEntryFinished(const int request_id);
  virtual void OnRenameEntryFinished(const int request_id);
  virtual void OnCreateFileFinished(const int request_id);
  virtual void OnWriteFileFinished(const int request_id);
  virtual void OnTruncateFileFinished(const int request_id);

 private:

  std::map<int, SftpThread*> sftp_thread_map_;

  pp::Core *pp_core_;
  pp::CompletionCallbackFactory<SftpInstance> factory_;

  SftpThread *sftp_thread_;

  int GetIntegerValueFromString(const std::string &source);
  libssh2_uint64_t GetUint64ValueFromString(const std::string &source);
  size_t GetSizeValueFromString(const std::string &source);

  void SendResponse(const int request_id,
                    const std::string &message,
                    const std::vector<std::string> &values);
  void SendResponseAsStringArray(int32_t result,
                                 const int request_id,
                                 const std::string &message,
                                 const std::vector<std::string> &values);
  void SendResponse(const int request_id,
                    const std::string &message,
                    const std::vector<pp::Var> &values);
  void SendResponseAsJsonObjectArray(int32_t result,
                                     const int request_id,
                                     const std::string &message,
                                     const std::vector<pp::Var> &values);
  void SendResponse(const int request_id,
                    const std::string &message,
                    const pp::VarDictionary &value);
  void SendResponseAsJsonObject(int32_t result,
                                const int request_id,
                                const std::string &message,
                                const pp::VarDictionary &value);

};

class SftpModule : public pp::Module
{

 public:

  SftpModule();
  virtual ~SftpModule();
  virtual pp::Instance* CreateInstance(PP_Instance instance);

};

namespace pp {

  Module* CreateModule() {
    return new SftpModule();
  }

}

#endif // SFTP_H
