#ifndef BASE64_H
#define BASE64_H

#include <string>
#include <vector>

namespace base64
{
  bool Encode(const std::vector<unsigned char> &src, std::string &dst);
  bool Decode(const std::string &src, std::vector<unsigned char> &dst);
}

#endif // BASE64_H
