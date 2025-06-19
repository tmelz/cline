import * as vscode from "vscode"
import pWaitFor from "p-wait-for"

import { CloudService } from "@roo-code/cloud"

import { ClineProvider } from "../core/webview/ClineProvider"
import { Package } from "../shared/package"

export const handleUri = async (uri: vscode.Uri) => {
	const path = uri.path
	const query = new URLSearchParams(uri.query.replace(/\+/g, "%2B"))

	if (path === "/task") {
		await vscode.commands.executeCommand(`${Package.name}.SidebarProvider.focus`)

		let sidebarController = ClineProvider.getVisibleInstance()

		// The sidebar might not have been opened in a fresh VS Code window yet.
		// Give it a moment to resolve instead of failing immediately.
		if (!sidebarController) {
			try {
				await pWaitFor(
					() => {
						sidebarController = ClineProvider.getVisibleInstance()
						return !!sidebarController
					},
					{ timeout: 3000, interval: 50 },
				)
			} catch {
				// Timed out ‑ handled below
			}
		}

		if (sidebarController) {
			await sidebarController.handleDeepLink(uri)
		} else {
			vscode.window.showErrorMessage("Roo Code sidebar not available to handle the task link.")
		}
		return
	}

	const visibleProvider = ClineProvider.getVisibleInstance()

	if (!visibleProvider) {
		return
	}

	switch (path) {
		case "/glama": {
			const code = query.get("code")
			if (code) {
				await visibleProvider.handleGlamaCallback(code)
			}
			break
		}
		case "/openrouter": {
			const code = query.get("code")
			if (code) {
				await visibleProvider.handleOpenRouterCallback(code)
			}
			break
		}
		case "/requesty": {
			const code = query.get("code")
			if (code) {
				await visibleProvider.handleRequestyCallback(code)
			}
			break
		}
		case "/auth/clerk/callback": {
			const code = query.get("code")
			const state = query.get("state")
			await CloudService.instance.handleAuthCallback(code, state)
			break
		}
		default:
			break
	}
}
