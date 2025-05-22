"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import type { ApiResponse } from "@/types/api"
import { AlertTriangle, BugOff, CheckCircle, RefreshCw, Code, TableIcon, Copy, ExternalLink, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ResponseDisplayProps {
  response: ApiResponse | null
  onRetryValidation: () => void
}

interface BugTicketResponse {
 status: string;
 ticket_url: string;
}

export function ResponseDisplay({ response, onRetryValidation }: ResponseDisplayProps) {
  const [activeTab, setActiveTab] = useState("table")
  const [copied, setCopied] = useState(false)
  const [bugTicketResponse, setBugTicketResponse] = useState<BugTicketResponse | null>(null)
  const [isCreatingTicket, setIsCreatingTicket] = useState(false)
  
  const handleCreateBugTicket = async () => {
    if (!response) return;
    
    setIsCreatingTicket(true);
    setBugTicketResponse(null);
    
    try {
      const ticketData = new FormData();
      ticketData.append('project_key', 'VAI');
      
      
      const res = await fetch("http://15.206.160.202:2000/api/generate_bug_ticket", {
        method: "POST",
        body: ticketData
      });
      
      const data = await res.json();
      setBugTicketResponse(data);
    } catch (error) {
      console.error("Failed to create bug ticket:", error);
      setBugTicketResponse({
        status: "error",
        ticket_url: ""
      });
    } finally {
      setIsCreatingTicket(false);
    }
  };

  if (!response) {
    return (
      <Card className="w-full h-full shadow-sm">
        <CardHeader className="colored-header">
          <CardTitle className="flex items-center gap-2 text-xl">
            <ExternalLink className="h-5 w-5" />
            Response
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[500px] text-muted-foreground p-6">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Code className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-lg font-medium mb-2">No response data yet</p>
          <p className="text-sm text-center max-w-md">
            Send a request using the form on the left to see the API response here
          </p>
        </CardContent>
      </Card>
    )
  }

  const isValidationFailed = response.validation === "Fail"

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(response, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className={isValidationFailed ? "error-header" : "success-header"}>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-xl">
            <ExternalLink className="h-5 w-5" />
            Response
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isValidationFailed ? "destructive" : "default"} className="bg-white/20">
              {response.validation}
            </Badge>
            <Badge variant="outline" className="bg-white/20 border-white/40">
              Status: {response.status_code}
            </Badge>
          </div>
        </div>
        {isValidationFailed && (
          <div className="mt-2">
            <Button
              onClick={onRetryValidation}
              variant="secondary"
              className="bg-white/20 hover:bg-white/30 text-white border-white/40"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Validation
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1">
            <TabsTrigger
              value="table"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 flex items-center gap-2"
            >
              <TableIcon className="h-4 w-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger
              value="raw"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              Raw JSON
            </TabsTrigger>
          </TabsList>
          <TabsContent value="table" className="space-y-6">
            {isValidationFailed ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium">
                  <AlertTriangle className="h-5 w-5" />
                  {response.bug_title}
                </div>
                <ul className="mt-3 text-sm text-red-600 dark:text-red-300 pl-6 list-disc space-y-1">
                  {Array.isArray(response.discrepancies)
                    ? response.discrepancies.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))
                    : String(response.discrepancies)
                        .split('\n')
                        .filter(Boolean)
                        .map((line, idx) => <li key={idx}>{line}</li>)}
                </ul>
                <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-800">
                  <Button 
                    onClick={handleCreateBugTicket} 
                    variant="destructive" 
                    className="flex items-center"
                    disabled={isCreatingTicket}
                  >
                    {isCreatingTicket ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Ticket...
                      </>
                    ) : (
                      <>
                        <BugOff className="mr-2 h-4 w-4" />
                        Create Bug Ticket
                      </>
                    )}
                  </Button>
                  
                  {bugTicketResponse && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${
                      bugTicketResponse.status === "success"
                        ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300" 
                        : "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300"
                    }`}>
                      <a
                        href={bugTicketResponse.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 hover:underline break-all"
                      >
                        {bugTicketResponse.ticket_url}
                      </a>
                   
                     
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                  <CheckCircle className="h-5 w-5" />
                  Validation Passed Successfully
                </div>
                <p className="mt-1 text-sm text-green-600 dark:text-green-300">
                  All expected values match the generated output.
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-900 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-medium">Request Details</h3>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                <div className="grid grid-cols-3 px-4 py-3">
                  <div className="font-medium text-sm">Endpoint</div>
                  <div className="col-span-2 text-sm font-mono break-all">{response.endpoint}</div>
                </div>
               
                <div className="grid grid-cols-3 px-4 py-3">
                  <div className="font-medium text-sm">Status Code</div>
                  <div className="col-span-2 text-sm">
                    <Badge
                      variant={response.status_code >= 200 && response.status_code < 300 ? "default" : "destructive"}
                    >
                      {response.status_code}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Response Comparison</h3>
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900">
                    <TableRow>
                
                      <TableHead className="font-medium">Expected</TableHead>
                      <TableHead className="font-medium">Generated</TableHead>
                   
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compareObjects(response.expected_op, response.generated_op).map((row, index) => (
                      <TableRow key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      
                        <TableCell className="font-mono text-xs">{row.expected}</TableCell>
                        <TableCell className="font-mono text-xs">{row.actual}</TableCell>
                     
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="raw">
            <div className="relative">
              <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto max-h-[500px] text-sm font-mono">
                {JSON.stringify(response, null, 2)}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-3 right-3 bg-slate-800 text-white border-slate-700 hover:bg-slate-700 hover:text-white"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy JSON
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Helper function to compare objects and generate table rows
function compareObjects(expected: any, actual: any) {
  const result: Array<{ path: string; expected: string; actual: string; match: boolean }> = []

  function traverse(exp: any, act: any, path = "") {
    if (typeof exp !== "object" || exp === null) {
      result.push({
        path: path,
        expected: String(exp),
        actual: act !== undefined ? String(act) : "undefined",
        match: exp === act,
      })
      return
    }

    if (Array.isArray(exp)) {
      if (!Array.isArray(act)) {
        result.push({
          path: path,
          expected: "Array",
          actual: typeof act,
          match: false,
        })
        return
      }

      // For arrays, we'll just check length and first few items
      result.push({
        path: `${path}.length`,
        expected: String(exp.length),
        actual: String(act.length),
        match: exp.length === act.length,
      })

      // Check first 3 items
      const checkLength = Math.min(exp.length, 3)
      for (let i = 0; i < checkLength; i++) {
        traverse(exp[i], act[i], `${path}[${i}]`)
      }
      return
    }

    // For objects
    for (const key in exp) {
      const newPath = path ? `${path}.${key}` : key
      if (act === undefined) {
        result.push({
          path: newPath,
          expected: typeof exp[key] === "object" ? JSON.stringify(exp[key]) : String(exp[key]),
          actual: "undefined",
          match: false,
        })
      } else if (typeof exp[key] === "object" && exp[key] !== null) {
        traverse(exp[key], act[key], newPath)
      } else {
        result.push({
          path: newPath,
          expected: String(exp[key]),
          actual: act[key] !== undefined ? String(act[key]) : "undefined",
          match: exp[key] === act[key],
        })
      }
    }
  }

  traverse(expected, actual)
  return result
}
