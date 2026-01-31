package com.example.call_logs

import android.provider.CallLog
import android.database.Cursor
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.util.Date
import java.text.SimpleDateFormat
import java.util.Locale

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.example.call_logs/logs"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            if (call.method == "getCallLogs") {
                val logs = getCallLogs()
                if (logs != null) {
                    result.success(logs)
                } else {
                    result.error("UNAVAILABLE", "Call logs not available.", null)
                }
            } else {
                result.notImplemented()
            }
        }
    }

    private fun getCallLogs(): List<Map<String, String>> {
        val callLogs = mutableListOf<Map<String, String>>()
        val resolver = contentResolver
        val cursor: Cursor? = resolver.query(CallLog.Calls.CONTENT_URI, null, null, null, CallLog.Calls.DATE + " DESC")

        cursor?.use {
            val numberIndex = it.getColumnIndex(CallLog.Calls.NUMBER)
            val typeIndex = it.getColumnIndex(CallLog.Calls.TYPE)
            val dateIndex = it.getColumnIndex(CallLog.Calls.DATE)
            val durationIndex = it.getColumnIndex(CallLog.Calls.DURATION)
            val nameIndex = it.getColumnIndex(CallLog.Calls.CACHED_NAME)

            while (it.moveToNext()) {
                val phNumber = it.getString(numberIndex) ?: "Unknown"
                val callType = it.getInt(typeIndex)
                val callDate = it.getLong(dateIndex)
                val callDuration = it.getString(durationIndex) ?: "0"
                val cachedName = if (nameIndex != -1) it.getString(nameIndex) ?: "" else ""

                val dir = when (callType) {
                    CallLog.Calls.OUTGOING_TYPE -> "OUTGOING"
                    CallLog.Calls.INCOMING_TYPE -> "INCOMING"
                    CallLog.Calls.MISSED_TYPE -> "MISSED"
                    CallLog.Calls.REJECTED_TYPE -> "REJECTED"
                    else -> "UNKNOWN"
                }

                val formattedDate = SimpleDateFormat("dd-MM-yyyy HH:mm:ss", Locale.getDefault()).format(Date(callDate))

                val log = mapOf(
                    "number" to phNumber,
                    "type" to dir,
                    "date" to formattedDate,
                    "duration" to callDuration,
                    "name" to cachedName
                )
                callLogs.add(log)
            }
        }
        return callLogs
    }
}
