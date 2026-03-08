import { TestMode } from "@/components/visuals/TestMode"
import { MobileBottomTabs } from "@/components/navigation/MobileBottomTabs"

export default function TestModePage() {
  return (
    <>
      <main className="mobile-content-safe mx-auto w-full max-w-6xl p-4 md:p-8 md:pb-8">
        <TestMode />
      </main>
      <MobileBottomTabs activeRoute="chat" />
    </>
  )
}
