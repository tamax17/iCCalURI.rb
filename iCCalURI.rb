#!/usr/bin/env ruby

require 'net/https'
require 'uri'
require 'rexml/document'
require 'nkf'

class ReqCaller
  attr_reader :response
  attr_reader :uriPath

  def initialize(appleId, password, serverNum='01')
    @appleId = appleId
    @password = password
    @uriPath = 'https://p' + serverNum + '-caldav.icloud.com'
  end

  def request(data, path='/')
    uri = URI.parse(@uriPath + path)
    req = Net::HTTP::Propfind.new(uri.path, {'Depth' => '1'})
    req.basic_auth(@appleId, @password)
    http = Net::HTTP.new(uri.host, uri.port)
    if uri.scheme == "https"
      http.use_ssl = true
      http.verify_mode = OpenSSL::SSL::VERIFY_NONE
    end
    http.start do
      http.request(req, data) do |res|
        @response = res
      end
    end
  end
end

class ICCalListGetter
  def initialize(appleId, password, serverNum='01')
    @caller = ReqCaller.new(appleId, password, serverNum)
  end

  def getUserId
    req  = '<A:propfind xmlns:A="DAV:">'
    req += '<A:prop><A:current-user-principal/></A:prop>'
    req += '</A:propfind>'

    @caller.request(req)
    raise @caller.response.body if (@caller.response.class != Net::HTTPSuccess)
    xml = REXML::Document.new(@caller.response.body)
    xpath = '/multistatus/response/propstat/prop/current-user-principal/href'
    href = xml.elements[xpath].text
    return href.split('/')[1]
  end

  def getURLs(userId)
    req  = '<A:propfind xmlns:A="DAV:">'
    req += '<A:prop><A:displayname/></A:prop>'
    req += '</A:propfind>'

    path = '/' + userId + '/calendars/'
    @caller.request(req, path)
    raise @caller.response.body if (@caller.response.class != Net::HTTPSuccess)
    xml = REXML::Document.new(@caller.response.body)
    result = Array.new
    xml.elements.each('/multistatus/response') do |elm|
      e = elm.elements
      item = { 'name' => e['propstat/prop/displayname'].text,
               'href' => @caller.uriPath + e['href'].text }
      result << item
    end
    return result
  end

  def run
    userId = self.getUserId
    return self.getURLs(userId)
  end

end

def isMSWIN
  return RUBY_PLATFORM.downcase =~ /mswin(?!ce)|mingw|cygwin|bccwin/
end

if ARGV.length < 2
  puts "Usage: hoge appleId password <01~10>"
  exit
end

begin
  server = '01'
  server = ARGV[2] if ARGV.length >= 3

  ic = ICCalListGetter.new(ARGV[0], ARGV[1], server)
  buff = ic.run
  buff.each do |item|
    buff = item['name'] + ':' + item['href']
    buff = NKF.nkf('-sx', buff) if (isMSWIN)
    puts buff
  end
  puts "done."
rescue => e
  p e
  puts "error."
end
