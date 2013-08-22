// FnordMetric Enterprise
//   (c) 2011-2013 Paul Asmuth <paul@paulasmuth.com>
//
// Licensed under the MIT License (the "License"); you may not use this
// file except in compliance with the License. You may obtain a copy of
// the License at: http://opensource.org/licenses/MIT

package com.fnordmetric.enterprise

import java.io.RandomAccessFile
import java.io.File
import java.nio.ByteBuffer
import java.nio.ByteOrder
import scala.collection.mutable.ListBuffer

class SwapFile(metric_key: MetricKey) {
  var last_flush : Long = 0

  val buffer = ByteBuffer.allocate(512)
  buffer.order(ByteOrder.BIG_ENDIAN)

  // each sample is 18 bytes big (2 bytes header, 8 bytes time and
  // 8 bytes value as double precision ieee 754 float)
  val BLOCK_SIZE = 18

  val file_name = "fnordmetric-" + metric_key.key +
    metric_key.mode + "-" + metric_key.flush_interval

  val file = new RandomAccessFile(new File(
    FnordMetric.CONFIG('swap_prefix), file_name), "rwd")

  var write_pos = file.length.toInt

  // adds a new (time, value) tuple to be written to the swap file
  // but does not write it yet. this method is not thread safe!
  def put(time: Long, value: Double) : Unit = this.synchronized {
    val bvalue = java.lang.Double.doubleToLongBits(value)

    if (buffer.remaining < BLOCK_SIZE)
      flush

    buffer.putShort(0x1717)
    buffer.putLong(time)
    buffer.putLong(bvalue)
  }

  // fluhes the queued writes from the buffer to disk. this method
  // is not thread safe!
  def flush : Unit = this.synchronized {
    last_flush = FnordMetric.now

    if (buffer.position < BLOCK_SIZE)
      return

    file.synchronized {
      file.seek(write_pos)
      file.write(buffer.array, 0, buffer.position)
    }

    write_pos += BLOCK_SIZE
    buffer.rewind
  }

  // reads a chunk of of values from the swapfile at position into the
  // specified destionation list buffer. this method is thread safe
  def load_chunk(position: Int, dst: ListBuffer[(Long, Double)]) : Int = {
    var read_pos = 0

    // we read the data back in 65535 byte blocks (3640 samples per block)
    var chunk_size = BLOCK_SIZE * 3640
    val chunk = ByteBuffer.allocate(chunk_size)

    if (position < chunk_size)
      chunk_size = position

    // read the next chunk into memory
    while (read_pos < chunk_size - 1) {

      // we need to seek before every read as calls to load_chunk don't
      // have to be synchronized with writes
      val nxt_read = file.synchronized {
        file.seek(position - chunk_size)

        file.read(chunk.array, read_pos,
          chunk_size - read_pos - 1)
      }

      if (nxt_read >= 0)
        read_pos += nxt_read
      else
        // this should never happen
        FnordMetric.error("end of file reached while reading " + file_name, false)

    }

    read_pos = chunk_size - BLOCK_SIZE

    while (read_pos >= 0) {
      chunk.position(read_pos)

      if (chunk.getShort != 0x1717 && read_pos != 0) {
        FnordMetric.error("file corrupted: " + file_name, false)
        return position - chunk_size
      }

      dst += ((chunk.getLong,
        java.lang.Double.longBitsToDouble(chunk.getLong)))

      read_pos -= BLOCK_SIZE
    }

    position - chunk_size
  }

}

