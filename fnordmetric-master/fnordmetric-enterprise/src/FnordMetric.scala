// FnordMetric Enterprise
//   (c) 2011-2013 Paul Asmuth <paul@paulasmuth.com>
//
// Licensed under the MIT License (the "License"); you may not use this
// file except in compliance with the License. You may obtain a copy of
// the License at: http://opensource.org/licenses/MIT

package com.fnordmetric.enterprise

import java.util.Locale
import java.util.Date
import java.text.DateFormat
import java.io.File
import java.io.RandomAccessFile
import java.nio.channels.FileChannel
import java.nio.channels.FileLock
import java.text.DecimalFormat
import scala.collection.mutable.HashMap

object FnordMetric {

  val VERSION = "v1.2.8"

  val CONFIG  = HashMap[Symbol,String]()

  var DEFAULTS = HashMap[Symbol, String](
    'http_threads      -> "4",
    'websocket_threads -> "4",
    'tcp_threads       -> "4",
    'udp_threads       -> "4",
    'swap_prefix       -> "/tmp"
  )

  val number_format = new DecimalFormat("0.#####")

  var debug = false

  var flock : FileLock = null

  def main(args: Array[String]) : Unit = {
    var n = 0

    while (n < args.length) {

      if (args(n) == "--http")
        { CONFIG += (('http_port, args(n+1))); n += 2 }

      else if (args(n) == "--http-threads")
        { CONFIG += (('http_threads, args(n+1))); n += 2 }

      else if (args(n) == "--websocket")
        { CONFIG += (('websocket_port, args(n+1))); n += 2 }

      else if (args(n) == "--websocket-threads")
        { CONFIG += (('websocket_threads, args(n+1))); n += 2 }

      else if (args(n) == "--tcp")
        { CONFIG += (('tcp_port, args(n+1))); n += 2 }

      else if (args(n) == "--tcp-threads")
        { CONFIG += (('tcp_threads, args(n+1))); n += 2 }

      else if (args(n) == "--udp")
        { CONFIG += (('udp_port, args(n+1))); n += 2 }

      else if (args(n) == "--udp-threads")
        { CONFIG += (('udp_threads, args(n+1))); n += 2 }

      else if (args(n) == "--swapdir")
        { CONFIG += (('swap_prefix, args(n+1))); n += 2 }

      else if ((args(n) == "-d") || (args(n) == "--debug"))
        { debug = true; n += 1 }

      else if ((args(n) == "-h") || (args(n) == "--help"))
        return usage(true)

      else if (args(n) == "--benchmark")
        return Benchmark.run

      else {
        println("error: invalid option: " + args(n) + "\n")
        return usage(false)
      }

    }

    DEFAULTS.foreach(d =>
      if (CONFIG contains d._1 unary_!) CONFIG += d )

    boot
  }

  def boot = try {
    FnordMetric.log("FnordMetric Enterprise " + VERSION + " (c) 2013 Paul Asmuth")

    FnordMetric.log("Booting...")
    FnordMetric.log("    swapdir: " + FnordMetric.CONFIG('swap_prefix))

    flock = new RandomAccessFile(
      new File(FnordMetric.CONFIG('swap_prefix), "fnordmetric_server.lck"),
        "rw").getChannel.tryLock

    if (flock == null)
      error("cannot aquire fnordmetric_server.lck", true)

    val sched = new Scheduler
    sched.start

    if (CONFIG contains 'http)
      error("FIXPAUL: not yet implemented: http-server", true)

    val ws_server = if (CONFIG contains 'websocket_port)
      new HTTPServer(
        CONFIG('websocket_port).toInt,
        CONFIG('websocket_threads).toInt,
        new WebSocketHandler)

    val tcp_server = if (CONFIG contains 'tcp_port)
      new TCPServer(
        CONFIG('tcp_port).toInt,
        CONFIG('tcp_threads).toInt)

    val udp_server = if (CONFIG contains 'udp_port)
      new UDPServer(
        CONFIG('udp_port).toInt,
        CONFIG('udp_threads).toInt)

  } catch {
    case e: Exception => exception(e, true)
  }


  def banner() = {
    println("FnordMetric Enterprise v" + VERSION)
    println(" (c) 2011-2013 Paul Asmuth <paul@paulasmuth.com>\n\n")
  }

  def usage(show_banner: Boolean = true) = {
    if (show_banner) banner()

    println("usage: fnordmetric-server [options]                                            ")
    println("  --tcp-threads        <num>    number of tcp worker-threads (default: 4)      ")
    println("  --tcp                <port>   start tcp server on this port                  ")
    println("  --udp-threads        <num>    number of udp worker-threads (default: 4)      ")
    println("  --udp                <port>   start udp server on this port                  ")
    println("  --websocket          <port>   start websocket server on this port            ")
    println("  --websocket-threads  <num>    number of websocket worker-threads (default: 4)")
    println("  --http               <port>   start http server on this port                 ")
    println("  --http-threads       <num>    number of http worker-threads (default: 4)     ")
    println("  --admin              <port>   start http admin web interface on this port    ")
    println("  --swapdir            <path>   store the metric persistence files here (default: /tmp)")
    println("  -h, --help                    you're reading it...                           ")
    println("  -d, --debug                   debug mode                                     ")
  }


  def now : Long =
    System.currentTimeMillis


  def log(msg: String) = {
    val now = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.LONG, Locale.FRANCE)
    println("[" + now.format(new Date()) + "] " + msg)
  }


  def error(msg: String, fatal: Boolean) = {
    log("[ERROR] " + msg)

    if (fatal)
      exit(1)
  }


  def log_debug(msg: String) =
    if (debug)
      log("[DEBUG] " + msg)


  def exception(ex: Throwable, fatal: Boolean) = {
    error(ex.toString, false)

    for (line <- ex.getStackTrace)
      log_debug(line.toString)

    if (fatal)
      exit(1)
  }


  def exit(code: Int) = {
    if (flock != null)
      flock.release

    System.exit(code)
  }

}
