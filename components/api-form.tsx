"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Send, Upload, X, Plus, FileText, ChevronDown, ChevronUp, Link2 } from "lucide-react"
import { FileMapperEntry, FileIndicesMapping } from "@/types/api"

interface ApiFormProps {
  onSubmit: (formData: any) => void
  isLoading: boolean
}

export function ApiForm({ onSubmit, isLoading }: ApiFormProps) {
  const [showOptionalFields, setShowOptionalFields] = useState(false)
  // Interface for file mapping
  interface FileMapping {
    key: string;
    files: File[];
  }

  const [formData, setFormData] = useState({
    endpoint: "",
    request_type: "",
    expected_op: "",
    payload: "",
    query_params: "",
    header: "",
    auth_type_token: "",
    fileMapping: [] as FileMapping[],
  })
  
  // Separate state for "send empty" checkboxes
  const [sendEmptyPayload, setSendEmptyPayload] = useState(false);
  const [sendEmptyQuery, setSendEmptyQuery] = useState(false);
  const [sendEmptyHeader, setSendEmptyHeader] = useState(false);
  const [sendEmptyAuth, setSendEmptyAuth] = useState(false);
  const [sendEmptyFileKey, setSendEmptyFileKey] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    // Handle checkbox changes for separate state variables
    switch (name) {
      case "send_empty_payload":
        setSendEmptyPayload(checked);
        break;
      case "send_empty_query":
        setSendEmptyQuery(checked);
        break;
      case "send_empty_header":
        setSendEmptyHeader(checked);
        break;
      case "send_empty_auth":
        setSendEmptyAuth(checked);
        break;
      case "send_empty_file_key":
        setSendEmptyFileKey(checked);
        break;
      default:
        // For other checkboxes, update formData
        setFormData((prev) => ({ ...prev, [name]: checked }));
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // State to track currently selected key for file upload
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number | null>(null);

  const handleAddFileKey = (value: string) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        fileMapping: [...prev.fileMapping, { key: value, files: [] }],
      }))
    }
  }

  const handleRemoveFileKey = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      fileMapping: prev.fileMapping.filter((_, i) => i !== index),
    }))
    
    // Reset selected key if it was removed
    if (selectedKeyIndex === index) {
      setSelectedKeyIndex(null);
    } else if (selectedKeyIndex !== null && selectedKeyIndex > index) {
      // Adjust selected index if a key before it was removed
      setSelectedKeyIndex(selectedKeyIndex - 1);
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && selectedKeyIndex !== null) {
      const fileArray = Array.from(files)
      
      setFormData((prev) => {
        const updatedMapping = [...prev.fileMapping];
        updatedMapping[selectedKeyIndex] = {
          ...updatedMapping[selectedKeyIndex],
          files: [...updatedMapping[selectedKeyIndex].files, ...fileArray]
        };
        
        return {
          ...prev,
          fileMapping: updatedMapping
        };
      });

      // Reset the input to allow selecting the same file again
      e.target.value = ""
    }
  }

  const handleRemoveFile = (keyIndex: number, fileIndex: number) => {
    setFormData((prev) => {
      const updatedMapping = [...prev.fileMapping];
      updatedMapping[keyIndex] = {
        ...updatedMapping[keyIndex],
        files: updatedMapping[keyIndex].files.filter((_, i) => i !== fileIndex)
      };
      
      return {
        ...prev,
        fileMapping: updatedMapping
      };
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();

    // Append required fields
    formDataToSend.append('endpoint', formData.endpoint);
    formDataToSend.append('request_type', formData.request_type);
    formDataToSend.append('expected_op', formData.expected_op);

    // Append optional fields if they should be included
    if (!sendEmptyPayload && formData.payload) {
      formDataToSend.append('payload', formData.payload);
    }
    if (!sendEmptyQuery && formData.query_params) {
      formDataToSend.append('query_params', formData.query_params);
    }
    if (!sendEmptyHeader && formData.header) {
      formDataToSend.append('header', formData.header);
    }
    if (!sendEmptyAuth && formData.auth_type_token) {
      formDataToSend.append('auth_type_token', formData.auth_type_token);
    }

    // Process files if not sending empty
    if (!sendEmptyFileKey && formData.fileMapping.length > 0) {
      // Create arrays to store all files and their mapping
      const allFiles: File[] = [];
      const mapper: FileMapperEntry[] = [];
      
      // Process each file mapping entry
      formData.fileMapping.forEach((mapping) => {
        if (mapping.files.length > 0) {
          // Track indices for this key
          const indices: number[] = [];
          
          // Add files to the allFiles array and record their indices
          mapping.files.forEach((file) => {
            indices.push(allFiles.length);
            allFiles.push(file);
          });
          
          // Add mapping entry using key -> indices format
          if (indices.length > 0) {
            mapper.push({ [mapping.key]: indices });
          }
        }
      });
      
      // Add all files under a single 'file_data' key
      allFiles.forEach((file) => {
        formDataToSend.append('file_data', file);
      });
      
      // Add file mapper as JSON string
      if (mapper.length > 0) {
        formDataToSend.append('file_mapper', JSON.stringify(mapper));
      }
      
      console.log(`Added ${allFiles.length} files under 'file_data' key with mapping information`);
    }

    console.log("Submitting FormData with multipart/form-data content type");
    
    // FormData content logging for debugging
    for (const pair of formDataToSend.entries()) {
      if (pair[1] instanceof File) {
        console.log(`FormData: ${pair[0]} = File: ${(pair[1] as File).name} (${(pair[1] as File).size} bytes)`);
      } else {
        console.log(`FormData: ${pair[0]} = ${pair[1]}`);
      }
    }

    // Submit the FormData
    onSubmit(formDataToSend);
  };
  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="colored-header">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Send className="h-5 w-5" />
          API Request
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required Fields */}
          <div className="space-y-2">
            <Label htmlFor="endpoint" className="flex items-center text-sm font-medium">
              endpoint <span className="text-red-500 ml-1">*</span>
              <span className="text-xs text-muted-foreground ml-1">required</span>
            </Label>
            <Input
              id="endpoint"
              name="endpoint"
              value={formData.endpoint}
              onChange={handleChange}
              required
              placeholder="https://api.example.com/endpoint"
              className="border"
            />
            <p className="text-xs text-muted-foreground">string</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="request_type" className="flex items-center text-sm font-medium">
              request_type <span className="text-red-500 ml-1">*</span>
              <span className="text-xs text-muted-foreground ml-1">required</span>
            </Label>
            <Select
              defaultValue={formData.request_type}
              onValueChange={(value) => handleSelectChange("request_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select request type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">string</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_op" className="flex items-center text-sm font-medium">
              expected_op <span className="text-red-500 ml-1">*</span>
              <span className="text-xs text-muted-foreground ml-1">required</span>
            </Label>
            <Textarea
              id="expected_op"
              name="expected_op"
              value={formData.expected_op}
              onChange={handleChange}
              required
              placeholder='{"example": "value"}'
              className="font-mono bg-slate-50 dark:bg-slate-900 min-h-[100px]"
            />
            <p className="text-xs text-muted-foreground">string</p>
          </div>

          {/* Toggle Button for Optional Fields */}
          <div className="flex justify-center my-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowOptionalFields(!showOptionalFields)}
              className="w-full flex items-center justify-center gap-2"
            >
              {showOptionalFields ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Hide Optional Fields
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show Optional Fields
                </>
              )}
            </Button>
          </div>

          {/* Optional Fields */}
          {showOptionalFields && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="payload" className="flex items-center text-sm font-medium">
                    payload
                  </Label>
                  <Textarea
                    id="payload"
                    name="payload"
                    value={formData.payload}
                    onChange={handleChange}
                    placeholder="{}"
                    className="font-mono bg-slate-50 dark:bg-slate-900 h-[100px]"
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send_empty_payload"
                      checked={sendEmptyPayload}
                      onCheckedChange={(checked) => handleCheckboxChange("send_empty_payload", checked as boolean)}
                    />
                    <label
                      htmlFor="send_empty_payload"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Send empty value
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">string | (string | null)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="query_params" className="flex items-center text-sm font-medium">
                    query_params
                  </Label>
                  <Textarea
                    id="query_params"
                    name="query_params"
                    value={formData.query_params}
                    onChange={handleChange}
                    placeholder="{}"
                    className="font-mono bg-slate-50 dark:bg-slate-900 h-[100px]"
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send_empty_query"
                      checked={sendEmptyQuery}
                      onCheckedChange={(checked) => handleCheckboxChange("send_empty_query", checked as boolean)}
                    />
                    <label
                      htmlFor="send_empty_query"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Send empty value
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">string | (string | null)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="header" className="flex items-center text-sm font-medium">
                    header
                  </Label>
                  <Textarea
                    id="header"
                    name="header"
                    value={formData.header}
                    onChange={handleChange}
                    placeholder="{}"
                    className="font-mono bg-slate-50 dark:bg-slate-900 h-[100px]"
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send_empty_header"
                      checked={sendEmptyHeader}
                      onCheckedChange={(checked) => handleCheckboxChange("send_empty_header", checked as boolean)}
                    />
                    <label
                      htmlFor="send_empty_header"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Send empty value
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">string | (string | null)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth_type_token" className="flex items-center text-sm font-medium">
                    auth_type_token
                  </Label>
                  <Input
                    id="auth_type_token"
                    name="auth_type_token"
                    value={formData.auth_type_token}
                    onChange={handleChange}
                    placeholder="string"
                    className="bg-slate-50 dark:bg-slate-900"
                  />
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send_empty_auth"
                      checked={sendEmptyAuth}
                      onCheckedChange={(checked) => handleCheckboxChange("send_empty_auth", checked as boolean)}
                    />
                    <label
                      htmlFor="send_empty_auth"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Send empty value
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">string | (string | null)</p>
                </div>
              </div>

              <div className="space-y-4">
                
                <div className="space-y-2">
                  <Label className="flex items-center text-sm font-medium">File Keys and Uploads</Label>
                  <div className="space-y-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">
                    {formData.fileMapping.length > 0 ? (
                      <div className="space-y-4 mb-3">
                        {formData.fileMapping.map((mapping, keyIndex) => (
                          <div
                            key={keyIndex}
                            className="bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-sm">{mapping.key}</span>
                                <Badge variant="outline" className="ml-2">
                                  {mapping.files.length} file{mapping.files.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <div className="flex items-center">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedKeyIndex(keyIndex)}
                                  className={`mr-2 text-xs h-8 ${selectedKeyIndex === keyIndex ? 'bg-primary text-primary-foreground' : ''}`}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Files
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveFileKey(keyIndex)}
                                  className="h-7 w-7 p-0 rounded-full"
                                >
                                  <X className="h-4 w-4" />
                                  <span className="sr-only">Remove</span>
                                </Button>
                              </div>
                            </div>
                            
                            {mapping.files.length > 0 ? (
                              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mt-2 bg-slate-50 dark:bg-slate-900 p-2 rounded-md">
                                {mapping.files.map((file, fileIndex) => (
                                  <div
                                    key={fileIndex}
                                    className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-md"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <FileText className="h-4 w-4 text-primary" />
                                      <span className="truncate max-w-[180px] text-sm">{file.name}</span>
                                      <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveFile(keyIndex, fileIndex)}
                                      className="h-7 w-7 p-0 rounded-full"
                                    >
                                      <X className="h-4 w-4" />
                                      <span className="sr-only">Remove</span>
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-2 text-muted-foreground text-xs bg-slate-50 dark:bg-slate-900 rounded-md">
                                No files added to this key
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground text-sm">No file keys added</div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Add a new file key"
                        id="new_file_key"
                        className="bg-white dark:bg-slate-800"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddFileKey((e.target as HTMLInputElement).value)
                            ;(e.target as HTMLInputElement).value = ""
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const input = document.getElementById("new_file_key") as HTMLInputElement
                          handleAddFileKey(input.value)
                          input.value = ""
                        }}
                        className="bg-white dark:bg-slate-800"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Key
                      </Button>
                    </div>
                    
                    {selectedKeyIndex !== null && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-md">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                            Adding files to: <span className="font-bold">{formData.fileMapping[selectedKeyIndex]?.key}</span>
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedKeyIndex(null)}
                            className="h-7 w-7 p-0 rounded-full text-blue-700 dark:text-blue-400"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <Label
                          htmlFor="file_upload"
                          className="flex flex-col items-center justify-center w-full h-20 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 cursor-pointer"
                        >
                          <div className="flex flex-col items-center justify-center pt-3 pb-3">
                            <Upload className="h-5 w-5 text-blue-500 mb-1" />
                            <p className="text-xs text-blue-700 dark:text-blue-400">Click to select files or drop files here</p>
                          </div>
                          <Input id="file_upload" type="file" multiple onChange={handleFileUpload} className="hidden" />
                        </Label>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="send_empty_file_key"
                      checked={sendEmptyFileKey}
                      onCheckedChange={(checked) => handleCheckboxChange("send_empty_file_key", checked as boolean)}
                    />
                    <label
                      htmlFor="send_empty_file_key"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Send empty value
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">Files mapped to specific keys for upload</p>
                </div>
              </div>
            </>
          )}

          <Button type="submit" className="w-full bg-primary text-primary-foreground h-12" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Request...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Send Request
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
