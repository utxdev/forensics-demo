package com.example.app_ui

import android.provider.CallLog
import android.database.Cursor
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.util.Date
import java.text.SimpleDateFormat
import java.util.Locale
import android.content.pm.PackageManager
import android.content.pm.ApplicationInfo
import android.content.pm.PackageInfo
import android.util.Base64
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import java.io.ByteArrayOutputStream
import android.content.pm.PermissionInfo

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
            } else if (call.method == "getMessages") {
                val messages = getAllSms()
                result.success(messages)
            } else if (call.method == "getFiles") {
                val mimeType = call.argument<String>("mimeType")
                if (mimeType != null) {
                    val files = getFilesByMimeType(mimeType)
                    result.success(files)
                } else {
                    result.error("INVALID_ARGUMENT", "Mime type is required", null)
                }
            } else if (call.method == "getInstalledApps") {
                val apps = getInstalledApps()
                result.success(apps)
            } else if (call.method == "getAppDetails") {
                val packageName = call.argument<String>("packageName")
                if (packageName != null) {
                    val details = getAppDetails(packageName)
                    result.success(details)
                } else {
                    result.error("INVALID_ARGUMENT", "Package name is required", null)
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

    private fun getAllSms(): List<Map<String, String>> {
        val lstSms = mutableListOf<Map<String, String>>()
        val cr = contentResolver
        // Use content://sms to get both Inbox and Sent
        val c = cr.query(android.net.Uri.parse("content://sms"), null, null, null, null)
        
        // Cache for name resolution to avoid repetitive lookups
        val nameCache = mutableMapOf<String, String>()

        if (c != null) {
            val totalSMS = c.count
            if (c.moveToFirst()) {
                for (i in 0 until totalSMS) {
                    val id = c.getString(c.getColumnIndexOrThrow("_id"))
                    val address = c.getString(c.getColumnIndexOrThrow("address"))
                    val msgBody = c.getString(c.getColumnIndexOrThrow("body"))
                    val date = c.getString(c.getColumnIndexOrThrow("date"))
                    val type = c.getInt(c.getColumnIndexOrThrow("type"))

                    val formattedDate = try {
                        SimpleDateFormat("dd-MM-yyyy HH:mm:ss", Locale.getDefault()).format(Date(date.toLong()))
                    } catch (e: Exception) {
                        date
                    }
                    
                    val dir = if (type == 1) "INBOX" else if (type == 2) "SENT" else "UNKNOWN"

                    // Resolve Contact Name
                    var contactName = nameCache[address]
                    if (contactName == null) {
                        contactName = getContactName(address)
                        if (contactName != null) {
                            nameCache[address] = contactName
                        }
                    }

                    val sms = mapOf(
                        "id" to id,
                        "address" to address,
                        "body" to msgBody,
                        "date" to formattedDate,
                        "type" to dir,
                        "name" to (contactName ?: "")
                    )
                    lstSms.add(sms)
                    c.moveToNext()
                }
            }
            c.close()
        }
        return lstSms
    }

    private fun getContactName(phoneNumber: String): String? {
        var name = queryContactName(phoneNumber)
        if (name == null && phoneNumber.length > 10) {
            // Fallback: Try with the last 10 digits to handle country code discrepancies
            // e.g. Contact saved as 9876543210, SMS received from 919876543210
            val last10 = phoneNumber.takeLast(10)
            // Ensure we are indeed querying a different string to avoid redundancy (and check if it's all digits ideally)
            if (last10 != phoneNumber && last10.all { it.isDigit() }) {
                 name = queryContactName(last10)
            }
        }
        return name
    }

    private fun queryContactName(subNumber: String): String? {
        val uri = android.net.Uri.withAppendedPath(android.provider.ContactsContract.PhoneLookup.CONTENT_FILTER_URI, android.net.Uri.encode(subNumber))
        val projection = arrayOf(
            android.provider.ContactsContract.PhoneLookup.DISPLAY_NAME,
            android.provider.ContactsContract.PhoneLookup._ID
        )
        
        var contactName: String? = null
        val cursor = contentResolver.query(uri, projection, null, null, null)
        if (cursor != null) {
            if (cursor.moveToFirst()) {
                contactName = cursor.getString(cursor.getColumnIndexOrThrow(android.provider.ContactsContract.PhoneLookup.DISPLAY_NAME))
            }
            cursor.close()
        }
        return contactName
    }

    private fun getFilesByMimeType(mimeType: String): List<String> {
        val files = mutableListOf<String>()
        val uri = android.provider.MediaStore.Files.getContentUri("external")
        
        var selection: String
        var selectionArgs: Array<String>

        if (mimeType == "SUSPICIOUS") {
            // Suspicious files: APKs, Shell Scripts, Executables
            selection = "${android.provider.MediaStore.Files.FileColumns.MIME_TYPE} = ? OR " +
                        "${android.provider.MediaStore.Files.FileColumns.DISPLAY_NAME} LIKE ? OR " +
                        "${android.provider.MediaStore.Files.FileColumns.DISPLAY_NAME} LIKE ? OR " +
                        "${android.provider.MediaStore.Files.FileColumns.DISPLAY_NAME} LIKE ?"
            selectionArgs = arrayOf(
                "application/vnd.android.package-archive", // APK mime
                "%.apk", // APK extension (fallback)
                "%.sh", // Shell scripts
                "%.exe" // Windows Executables
            )
        } else {
            selection = android.provider.MediaStore.Files.FileColumns.MIME_TYPE + " LIKE ?"
            selectionArgs = arrayOf(mimeType)
            
            if (!mimeType.contains("%")) {
                 selection = android.provider.MediaStore.Files.FileColumns.MIME_TYPE + "=?"
            }
        }

        val cursor = contentResolver.query(
            uri,
            arrayOf(android.provider.MediaStore.Files.FileColumns.DATA),
            selection,
            selectionArgs,
            null
        )

        cursor?.use {
            val dataIndex = it.getColumnIndexOrThrow(android.provider.MediaStore.Files.FileColumns.DATA)
            while (it.moveToNext()) {
                val filePath = it.getString(dataIndex)
                if (filePath != null) {
                    val file = java.io.File(filePath)
                    if (file.exists()) {
                        files.add(filePath)
                    }
                }
            }
        }
        return files
    }

    private fun getInstalledApps(): List<Map<String, Any?>> {
        val apps = mutableListOf<Map<String, Any?>>()
        val pm = packageManager
        val flags = PackageManager.GET_META_DATA or PackageManager.GET_PERMISSIONS
        val packages = pm.getInstalledPackages(flags)

        for (pkg in packages) {
            val appInfo = pkg.applicationInfo
            if (appInfo == null) continue

            val appName = appInfo.loadLabel(pm).toString()
            val packageName = pkg.packageName
            val versionName = pkg.versionName ?: "Unknown"
            val installDate = pkg.firstInstallTime
            val updateDate = pkg.lastUpdateTime
            
            val isSystem = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            
            val launchIntent = pm.getLaunchIntentForPackage(packageName)
            val isHidden = launchIntent == null
            
            val permissions = pkg.requestedPermissions?.toList() ?: emptyList<String>()

            val dateFormat = SimpleDateFormat("dd-MM-yyyy", Locale.getDefault())
            
            val appMap = mapOf(
                "name" to appName,
                "packageName" to packageName,
                "version" to versionName,
                "installDate" to dateFormat.format(Date(installDate)),
                "updateDate" to dateFormat.format(Date(updateDate)),
                "isSystem" to isSystem,
                "isHidden" to isHidden,
                "permissions" to permissions
            )
            apps.add(appMap)
        }
        return apps
        return apps
    }

    private fun getAppDetails(packageName: String): Map<String, Any?> {
        val pm = packageManager
        val pkgInfo = pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS or PackageManager.GET_SIGNATURES)
        
        // 1. Icon
        val iconDrawable = pm.getApplicationIcon(packageName)
        val iconBase64 = drawableToBase64(iconDrawable)

        // 2. Permissions with Danger Level
        val permissions = mutableListOf<Map<String, Any>>()
        val requestedPermissions = pkgInfo.requestedPermissions
        if (requestedPermissions != null) {
            for (p in requestedPermissions) {
                var isDangerous = false
                try {
                    val pInfo = pm.getPermissionInfo(p, 0)
                    val protectionLevel = pInfo.protectionLevel and PermissionInfo.PROTECTION_MASK_BASE
                    isDangerous = protectionLevel == PermissionInfo.PROTECTION_DANGEROUS
                } catch (e: PackageManager.NameNotFoundException) {
                    // Custom permissions or unknown might throw this
                }
                
                permissions.add(mapOf(
                    "name" to p,
                    "isDangerous" to isDangerous
                ))
            }
        }

        // 3. Signatures (SHA-256)
        // Note: GET_SIGNATURES is deprecated in favor of GET_SIGNING_CERTIFICATES, 
        // but for broader compat without complex loops, we use the simpler deprecated field for now or PackageInfo.signatures
        // For simple display:
        val signatures = pkgInfo.signatures?.map { it.toCharsString().take(30) + "..." } ?: emptyList()

        return mapOf(
            "icon" to iconBase64,
            "permissions" to permissions,
            "signatures" to signatures
        )
    }

    private fun drawableToBase64(drawable: Drawable): String {
        val bitmap = if (drawable is BitmapDrawable) {
            drawable.bitmap
        } else {
            val bitmap = Bitmap.createBitmap(drawable.intrinsicWidth, drawable.intrinsicHeight, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bitmap)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            bitmap
        }
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream)
        val byteArray = stream.toByteArray()
        return Base64.encodeToString(byteArray, Base64.NO_WRAP)
    }
}
