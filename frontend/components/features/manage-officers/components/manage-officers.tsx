"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/shared/ui/card";
import { Button } from "@/components/shared/ui/button";
import { Input } from "@/components/shared/ui/input";
import { Label } from "@/components/shared/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
} from "@/components/shared/ui/dialog";
import { Save, Edit, Trash2, X, User, Plus } from "lucide-react";
import { DialogHeader } from "@/components/shared/layout/dialog-header/dialog-header";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/shared/ui/select";
import { useOfficers } from "../hooks/use-officers";
import type { Officer } from "@/lib/types/api/v1/officer";

interface OfficerFormProps {
  officer?: Officer;
  onSubmit: (data: any) => Promise<boolean>;
}

function OfficerFormDialog({ officer, onSubmit }: OfficerFormProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: officer?.name || "",
    username: officer?.username || "",
    password: "",
    role: officer?.role || "officer",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const data = officer
      ? { ...formData, password: formData.password || undefined }
      : formData;

    const success = await onSubmit(data);
    setSubmitting(false);

    if (success) setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={officer ? "outline" : "default"}>
          {officer ? (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Officer
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader
          title={officer ? "Edit Officer" : "Create Officer"}
          description={officer ? "Update officer info" : "Add a new officer"}
          icon={<User className="h-5 w-5" />}
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Username</Label>
            <Input
              value={formData.username}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Password</Label>
            <Input
              type="password"
              minLength={6}
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              required={!officer}
            />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Select
              value={formData.role}
              onValueChange={(val) =>
                setFormData((prev) => ({ ...prev, role: val }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="officer">Officer</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? (
                <span className="h-4 w-4 mr-2 animate-spin border-2 border-t-transparent rounded-full" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {officer ? "Update" : "Create"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ManageOfficers() {
  const { officers, isLoading, handleCreate, handleUpdate, handleDelete } =
    useOfficers();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <User className="h-5 w-5" /> Manage Officers
        </h2>
        <OfficerFormDialog onSubmit={handleCreate} />
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground py-10">
          Loading...
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {officers.map((officer) => (
            <Card key={officer.id}>
              <CardHeader>
                <CardTitle className="text-base">{officer.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">
                  <strong>Username:</strong> {officer.username}
                </div>
                <div className="text-sm">
                  <strong>Role:</strong> {officer.role}
                </div>
                <div className="flex gap-2 pt-2">
                  <OfficerFormDialog
                    officer={officer}
                    onSubmit={(data) => {
                      return handleUpdate(officer.id, data); // ✅ return để OfficerForm biết thành công/thất bại
                    }}
                  />
                  <Button
                    onClick={() => handleDelete(officer.id)}
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
