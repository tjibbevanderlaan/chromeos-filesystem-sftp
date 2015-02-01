#ifndef SFTP_EVENT_LISTENER
#define SFTP_EVENT_LISTENER

#include "json/json.h"

#include <string>
#include <vector>

class SftpEventListener
{

 public:

  virtual ~SftpEventListener() {};

  virtual void OnHandshakeFinished(const int request_id,
                                   const std::string &fingerprint,
                                   const std::string &hostkey_method) = 0;
  virtual void OnErrorOccurred(const int request_id,
                               const std::string &message) = 0;
  virtual void OnShutdown(const int request_id) = 0;
  virtual void OnAuthenticationFinished(const int request_id) = 0;
  virtual void OnMetadataListFetched(const int request_id,
                                     const std::vector<Json::Value> &metadataList) = 0;
  virtual void OnReadFile(const int request_id,
                          const std::string &b64_data,
                          const int length,
                          const bool has_more) = 0;
  virtual void OnMakeDirectoryFinished(const int request_id) = 0;
  virtual void OnDeleteEntryFinished(const int request_id) = 0;
  virtual void OnRenameEntryFinished(const int request_id) = 0;
  virtual void OnCreateFileFinished(const int request_id) = 0;
  virtual void OnWriteFileFinished(const int request_id) = 0;
  virtual void OnTruncateFileFinished(const int request_id) = 0;

};

#endif // SFTP_EVENT_LISTENER
