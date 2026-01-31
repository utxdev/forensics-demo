package com.antigravity.gandiva.data

import android.content.Context
import android.content.pm.PackageManager
import com.antigravity.gandiva.domain.model.AppInfo
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AppListManager(private val context: Context) {

    suspend fun getInstalledApps(): List<AppInfo> = withContext(Dispatchers.IO) {
        val appList = mutableListOf<AppInfo>()
        val packageManager = context.packageManager

        try {
            // QUERY_ALL_PACKAGES permission is needed for Android 11+
            val packages = packageManager.getInstalledPackages(PackageManager.GET_META_DATA)

            for (pkg in packages) {
                // Filter out some system apps if desired, but for forensics we usually want everything.
                // Here we might just capture basic info.
                
                // Note: Getting labels can be slow, so we do it cautiously.
                val label = pkg.applicationInfo?.loadLabel(packageManager)?.toString() ?: pkg.packageName
                
                appList.add(
                    AppInfo(
                        packageName = pkg.packageName,
                        appName = label,
                        versionName = pkg.versionName ?: "N/A",
                        installTime = pkg.firstInstallTime
                    )
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        
        return@withContext appList
    }
}
