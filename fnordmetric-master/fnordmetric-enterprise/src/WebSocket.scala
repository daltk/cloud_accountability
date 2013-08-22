// FnordMetric Enterprise
//   (c) 2011-2013 Paul Asmuth <paul@paulasmuth.com>
//
// Licensed under the MIT License (the "License"); you may not use this
// file except in compliance with the License. You may obtain a copy of
// the License at: http://opensource.org/licenses/MIT

package com.fnordmetric.enterprise

import org.eclipse.jetty.websocket.WebSocket.Connection

class WebSocket extends org.eclipse.jetty.websocket.WebSocket.OnTextMessage {

  var endpoint : Connection = null

  def onOpen(conn: Connection) : Unit = {
    endpoint = conn

    if (conn.getProtocol == null || conn.getProtocol != "fnordmetric_enterprise")
      return conn.close(1003, "fnordmetric_enterprise")

    FnordMetric.log_debug("[WebSocket] connection opened")
  }

  def onClose(code: Int, message: String) =
    FnordMetric.log_debug("[WebSocket] connection closed")

  def onMessage(message: String) = try {
    val ins = InstructionFactory.parse(message)
    endpoint.sendMessage(ins.execute);
  } catch {
    case e: Exception => FnordMetric.exception(e, false)
  }

}
