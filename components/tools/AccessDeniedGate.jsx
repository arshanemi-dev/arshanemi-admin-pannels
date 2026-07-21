import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

// Inline "you don't have access" notice — rendered by
// app/tools/[slug]/use/page.js in place of the tool when lib/toolAccess.js's
// resolveToolAccess() returns kind: 'access_denied' (the user is logged in
// but this tool isn't in their user_settings.tools_access grant). This is an
// admin-grant problem, not something the user can fix themselves on /plan —
// so unlike the fee/coins cases, this doesn't send them anywhere to pay.
export default function AccessDeniedGate({ tool }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-sm mx-auto bg-card border border-divider rounded-2xl p-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto mb-4">
          <ShieldAlert size={18} />
        </div>
        <h3 className="text-foreground font-bold text-lg mb-1">
          You don&apos;t have access to {tool.title}
        </h3>
        <p className="text-muted text-sm mb-4">
          This tool hasn&apos;t been enabled on your account. Please contact your admin to request access.
        </p>
        <Link
          href="/tools"
          className="inline-block text-sm font-semibold text-accent hover:text-accent-hover"
        >
          Back to Tools
        </Link>
      </div>
    </div>
  )
}
