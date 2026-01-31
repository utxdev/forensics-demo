package com.antigravity.gandiva.domain.model

data class SmsMessage(
    val address: String,
    val body: String,
    val timestamp: Long,
    val type: Int // 1 = Inbox, 2 = Sent
)

data class AppInfo(
    val packageName: String,
    val appName: String,
    val versionName: String,
    val installTime: Long
)

data class MediaItem(
    val id: Long,
    val uri: String,
    val mimeType: String,
    val dateTaken: Long,
    val latitude: Double?,
    val longitude: Double?
)

data class LocationPoint(
    val latitude: Double,
    val longitude: Double,
    val source: String, // "GPS" or "Exif"
    val timestamp: Long
)

data class ExtractionReport(
    val smsCount: Int,
    val appCount: Int,
    val mediaCount: Int,
    val locationPoints: Int,
    val vaultPath: String
)
