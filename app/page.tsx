"use client"

import { useState } from "react"
import { ApiForm } from "@/components/api-form"
import { ResponseDisplay } from "@/components/response-display"
import type { ApiResponse } from "@/types/api"
import { ThemeToggle } from "@/components/theme-toggle"

export default function Home() {
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleApiCall = async (formData: FormData) => {
    setIsLoading(true)
    try {
      // Log FormData contents for debugging
      console.log("Sending FormData to API:");
      for (const pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`  ${pair[0]}: File ${(pair[1] as File).name} (${(pair[1] as File).size} bytes)`);
        } else {
          console.log(`  ${pair[0]}: ${pair[1]}`);
        }
      }

      const res = await fetch("http://15.206.160.202:2000/api/validate_request", {
        method: "POST",
        // FormData automatically sets Content-Type to multipart/form-data with boundary
        body: formData,
      })
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      const data = await res.json()
      setResponse(data)
      return
      // In a real app, you would make the actual API call here
      // For demo purposes, we'll simulate a response based on the endpoint
      // const mockResponse = await simulateApiCall(formData)
      // setResponse(mockResponse)
    } catch (error) {
      console.error("API call failed:", error)
      setResponse({
        validation: "Fail",
        discrepancies: "API call failed",
        status_code: 500,
        test_id: "error",
        generated_op: {},
        expected_op: formData.get("expected_op") as string || "{}",
        endpoint: formData.get("endpoint") as string || "",
        bug_title: "API call failed",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetryValidation = () => {
    if (response) {
      // In a real app, you would call a different API endpoint here
      console.log("Calling validation retry API for:", response.endpoint)
      alert("Calling validation retry API for: " + response.endpoint)
    }
  }

  return (
    <main className="container mx-auto p-4 pb-20">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="text-center my-8">
        <h1 className="text-4xl font-bold mb-2 text-primary">API Testing Interface</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <ApiForm onSubmit={handleApiCall} isLoading={isLoading} />
        </div>
        <div>
          <ResponseDisplay response={response} onRetryValidation={handleRetryValidation} />
        </div>
      </div>
    </main>
  )
}

// Simulate API call for demo purposes
// async function simulateApiCall(formData: any): Promise<ApiResponse> {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       // Log file information if present
//       if (formData.fileObjects && formData.fileObjects.length > 0) {
//         console.log(
//           `Processing ${formData.fileObjects.length} files:`,
//           formData.fileObjects.map((f: File) => `${f.name} (${f.size} bytes)`),
//         )
//       }

//       // Check if the endpoint contains "nationalize.io"
//       if (formData.endpoint.includes("nationalize.io")) {
//         resolve({
//           validation: "Fail",
//           discrepancies: "1. The 'count' value differs: expected 617, but got 6172.",
//           test_id: "test123",
//           generated_op: {
//             count: 6172,
//             name: "nathaniel",
//             country: [
//               { country_id: "NG", probability: 0.36129701312 },
//               { country_id: "NE", probability: 0.07164615880444838 },
//               { country_id: "US", probability: 0.2673548926 },
//             ],
//           },
//           expected_op: JSON.parse(formData.expected_op || "{}"),
//           endpoint: formData.endpoint,
//           bug_title: "Mismatch in 'count' value between expected and generated outputs",
//           status_code: 200,
//         })
//       } else {
//         resolve({
//           validation: "Pass",
//           discrepancies: '',
//           test_id: "test456",
//           generated_op: { result: "success" },
//           expected_op: JSON.parse(formData.expected_op || "{}"),
//           endpoint: formData.endpoint,
//           bug_title: "",
//           status_code: 200,
//         })
//       }
//     }, 1000)
//   })
// }
