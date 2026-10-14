package com.roseachy.desk

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject

/** Add to the existing APK project; keep its existing package and Activity.
 * Register this object in onCreate before STARTED. Saves only to a user-chosen
 * SAF document. No broad storage permission, network upload, or PIN handling.
 */
class SmartSyncFileBridge(
    private val activity: AppCompatActivity,
    private val webView: WebView
) {
    private data class Save(val id: String, val name: String, val bytes: ByteArray)
    private var saving: Save? = null
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val saveLauncher = activity.registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val request = saving ?: return@registerForActivityResult
        saving = null
        val uri = result.data?.data
        if (result.resultCode != Activity.RESULT_OK || uri == null) {
            notify(request.id, "cancelled")
        } else {
            Thread {
                val status = try {
                    activity.contentResolver.openOutputStream(uri, "wt").use { stream ->
                        requireNotNull(stream) { "Document unavailable" }
                        stream.write(request.bytes)
                        stream.flush()
                    }
                    // Re-read the selected document: do not report a successful
                    // save merely because the chooser returned a URI.
                    val read = activity.contentResolver.openInputStream(uri).use { it?.readBytes() }
                    if (read != null && read.contentEquals(request.bytes)) "saved" else "failed"
                } catch (_: Exception) { "failed" }
                activity.runOnUiThread { notify(request.id, status) }
            }.start()
        }
    }
    private val chooseLauncher = activity.registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = fileCallback ?: return@registerForActivityResult
        fileCallback = null
        callback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result.resultCode, result.data))
    }

    @JavascriptInterface
    fun requestSave(id: String, name: String, contentBase64: String) {
        if (!name.matches(Regex("^[\\w .-]+\\.json$", RegexOption.IGNORE_CASE)) ||
            contentBase64.length > 45 * 1024 * 1024 || id.length > 100) {
            activity.runOnUiThread { notify(id, "failed") }; return
        }
        val bytes = try { Base64.decode(contentBase64, Base64.DEFAULT) }
        catch (_: IllegalArgumentException) { activity.runOnUiThread { notify(id, "failed") }; return }
        if (bytes.size > 32 * 1024 * 1024) { activity.runOnUiThread { notify(id, "failed") }; return }
        activity.runOnUiThread {
            if (saving != null) { notify(id, "failed"); return@runOnUiThread }
            saving = Save(id, name, bytes)
            saveLauncher.launch(Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "application/json"
                putExtra(Intent.EXTRA_TITLE, name)
            })
        }
    }

    /** Merge this file-picker behavior into the existing WebChromeClient;
     * do not replace its unrelated camera, fullscreen or permission handling.
     */
    fun onShowFileChooser(callback: ValueCallback<Array<Uri>>, params: WebChromeClient.FileChooserParams): Boolean {
        fileCallback?.onReceiveValue(null)
        fileCallback = callback
        return try {
            chooseLauncher.launch(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "application/json"
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            })
            true
        } catch (_: Exception) { fileCallback = null; callback.onReceiveValue(null); false }
    }

    private fun notify(id: String, status: String) {
        webView.evaluateJavascript(
            "window.RoseachyAndroid?.onSaved(${JSONObject.quote(id)},${JSONObject.quote(status)});", null
        )
    }
}
