package com.antigravity.gandiva.data

import android.content.Context
import android.provider.Telephony
import com.antigravity.gandiva.domain.model.SmsMessage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class SmsManager(private val context: Context) {

    suspend fun getAllMessages(): List<SmsMessage> = withContext(Dispatchers.IO) {
        val messages = mutableListOf<SmsMessage>()
        val projection = arrayOf(
            Telephony.Sms.ADDRESS,
            Telephony.Sms.BODY,
            Telephony.Sms.DATE,
            Telephony.Sms.TYPE
        )

        try {
            val cursor = context.contentResolver.query(
                Telephony.Sms.CONTENT_URI,
                projection,
                null,
                null,
                "${Telephony.Sms.DATE} DESC"
            )

            cursor?.use {
                val addressIdx = it.getColumnIndex(Telephony.Sms.ADDRESS)
                val bodyIdx = it.getColumnIndex(Telephony.Sms.BODY)
                val dateIdx = it.getColumnIndex(Telephony.Sms.DATE)
                val typeIdx = it.getColumnIndex(Telephony.Sms.TYPE)

                while (it.moveToNext()) {
                    // Check if indices are valid to avoid exceptions on some devices
                    if (addressIdx >= 0 && bodyIdx >= 0) {
                        messages.add(
                            SmsMessage(
                                address = it.getString(addressIdx) ?: "Unknown",
                                body = it.getString(bodyIdx) ?: "",
                                timestamp = it.getLong(dateIdx),
                                type = it.getInt(typeIdx)
                            )
                        )
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return@withContext messages
    }
}
