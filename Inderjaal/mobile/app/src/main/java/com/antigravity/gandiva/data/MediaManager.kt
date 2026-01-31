package com.antigravity.gandiva.data

import android.content.Context
import android.net.Uri
import android.provider.MediaStore
import com.antigravity.gandiva.domain.model.MediaItem
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MediaManager(private val context: Context) {

    suspend fun getAllMedia(): List<MediaItem> = withContext(Dispatchers.IO) {
        val mediaList = mutableListOf<MediaItem>()
        
        // Define columns to retrieve
        val projection = arrayOf(
            MediaStore.Images.Media._ID,
            MediaStore.Images.Media.DISPLAY_NAME,
            MediaStore.Images.Media.DATE_TAKEN,
            MediaStore.Images.Media.MIME_TYPE,
            // Accessing LATITUDE/LONGITUDE directly from MediaStore if indexed
            // Note: This often requires ACCESS_MEDIA_LOCATION permission on newer Android
            MediaStore.Images.Media.LATITUDE,
            MediaStore.Images.Media.LONGITUDE
        )

        val uri: Uri = MediaStore.Images.Media.EXTERNAL_CONTENT_URI
        // Fetching only Images for this prototype to keep it simple, can expand to Video.
        
        try {
            val cursor = context.contentResolver.query(
                uri,
                projection,
                null,
                null,
                "${MediaStore.Images.Media.DATE_TAKEN} DESC"
            )

            cursor?.use {
                val idColumn = it.getColumnIndexOrThrow(MediaStore.Images.Media._ID)
                val dateColumn = it.getColumnIndexOrThrow(MediaStore.Images.Media.DATE_TAKEN)
                val mimeColumn = it.getColumnIndexOrThrow(MediaStore.Images.Media.MIME_TYPE)
                val latColumn = it.getColumnIndex(MediaStore.Images.Media.LATITUDE)
                val longColumn = it.getColumnIndex(MediaStore.Images.Media.LONGITUDE)

                while (it.moveToNext()) {
                    val id = it.getLong(idColumn)
                    val contentUri = Uri.withAppendedPath(uri, id.toString()).toString()
                    val lat = if (latColumn >= 0) it.getDouble(latColumn) else 0.0
                    val lon = if (longColumn >= 0) it.getDouble(longColumn) else 0.0

                    // Filter out invalid coordinates (0.0/0.0 is usually invalid for standard GPS)
                    val validLat = if (lat != 0.0) lat else null
                    val validLon = if (lon != 0.0) lon else null

                    mediaList.add(
                        MediaItem(
                            id = id,
                            uri = contentUri,
                            mimeType = it.getString(mimeColumn) ?: "image/*",
                            dateTaken = it.getLong(dateColumn),
                            latitude = validLat,
                            longitude = validLon
                        )
                    )
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        return@withContext mediaList
    }
}
