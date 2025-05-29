"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, EyeOff, Trash } from "lucide-react"

interface TeamMember {
  id: string
  name: string
  email: string
  permissions: string[]
}

export default function TeamManagement() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  })
  const [permissions, setPermissions] = useState({
    manageAI: false,
    analytics: false,
    getAICode: false,
    salesLeads: false,
    chatHistory: false,
    team: false,
    billing: false,
  })
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setPermissions((prev) => ({ ...prev, [permission]: checked }))
  }

  const handleAddMember = () => {
    const activePermissions = Object.entries(permissions)
      .filter(([_, isActive]) => isActive)
      .map(([name]) => name)

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      permissions: activePermissions,
    }

    setTeamMembers([...teamMembers, newMember])
    setFormData({ name: "", email: "", password: "" })
    setPermissions({
      manageAI: false,
      analytics: false,
      getAICode: false,
      salesLeads: false,
      chatHistory: false,
      team: false,
      billing: false,
    })
  }

  const handleDeleteMember = (id: string) => {
    setTeamMembers(teamMembers.filter((member) => member.id !== id))
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter name"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter email"
            className="mt-1"
          />
        </div>

        <div className="relative">
          <Label htmlFor="password">Password</Label>
          <div className="flex mt-1">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-[calc(50%_+_4px)]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="font-medium mb-4">Access to Pages</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="manage-ai"
              checked={permissions.manageAI}
              onCheckedChange={(checked) => handlePermissionChange("manageAI", checked as boolean)}
            />
            <Label htmlFor="manage-ai">Manage AI</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="chat-history"
              checked={permissions.chatHistory}
              onCheckedChange={(checked) => handlePermissionChange("chatHistory", checked as boolean)}
            />
            <Label htmlFor="chat-history">Chat History</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="analytics"
              checked={permissions.analytics}
              onCheckedChange={(checked) => handlePermissionChange("analytics", checked as boolean)}
            />
            <Label htmlFor="analytics">Analytics</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="team"
              checked={permissions.team}
              onCheckedChange={(checked) => handlePermissionChange("team", checked as boolean)}
            />
            <Label htmlFor="team">Team</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="get-ai-code"
              checked={permissions.getAICode}
              onCheckedChange={(checked) => handlePermissionChange("getAICode", checked as boolean)}
            />
            <Label htmlFor="get-ai-code">Get AI Code & Test AI</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="billing"
              checked={permissions.billing}
              onCheckedChange={(checked) => handlePermissionChange("billing", checked as boolean)}
            />
            <Label htmlFor="billing">Billing</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="sales-leads"
              checked={permissions.salesLeads}
              onCheckedChange={(checked) => handlePermissionChange("salesLeads", checked as boolean)}
            />
            <Label htmlFor="sales-leads">Sales Leads</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <Button onClick={handleAddMember} className="bg-green-600 hover:bg-green-700">
          Add Team Member
        </Button>
      </div>

      <div>
        <h3 className="font-medium mb-4">Existing Team Members</h3>
        {teamMembers.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No team members added yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.permissions.join(", ")}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMember(member.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
