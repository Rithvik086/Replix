import React, { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

interface Rule {
  _id: string;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  conditions: Array<{
    type: "keyword" | "time" | "contact" | "message_type";
    operator: string;
    value: string | string[];
    caseSensitive?: boolean;
  }>;
  response: {
    type: "text" | "ai" | "none";
    content?: string;
    useAI?: boolean;
  };
  createdAt: string;
}

const RulesManagement: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [message, setMessage] = useState("");

  // Form state
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    enabled: boolean;
    priority: number;
    conditions: Array<{
      type: "keyword" | "time" | "contact" | "message_type";
      operator: string;
      value: string | string[];
      caseSensitive?: boolean;
    }>;
    response: {
      type: "text" | "ai" | "none";
      content?: string;
      useAI?: boolean;
    };
  }>({
    name: "",
    description: "",
    enabled: true,
    priority: 1,
    conditions: [
      {
        type: "keyword" as const,
        operator: "contains",
        value: "",
        caseSensitive: false,
      },
    ],
    response: {
      type: "text" as const,
      content: "",
      useAI: false,
    },
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/rules");
      setRules(response.data.rules || []);
    } catch (error: any) {
      setMessage("Failed to fetch rules");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRule) {
        await axiosInstance.put(`/rules/${editingRule._id}`, formData);
        setMessage("Rule updated successfully");
      } else {
        await axiosInstance.post("/rules", formData);
        setMessage("Rule created successfully");
      }

      resetForm();
      fetchRules();
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Failed to save rule");
    }
  };

  const handleToggle = async (ruleId: string) => {
    try {
      await axiosInstance.patch(`/rules/${ruleId}/toggle`);
      fetchRules();
    } catch (error: any) {
      setMessage("Failed to toggle rule");
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;

    try {
      await axiosInstance.delete(`/rules/${ruleId}`);
      setMessage("Rule deleted successfully");
      fetchRules();
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage("Failed to delete rule");
    }
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || "",
      enabled: rule.enabled,
      priority: rule.priority,
      conditions: rule.conditions,
      response: rule.response,
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      enabled: true,
      priority: 1,
      conditions: [
        {
          type: "keyword" as const,
          operator: "contains",
          value: "",
          caseSensitive: false,
        },
      ],
      response: {
        type: "text" as const,
        content: "",
        useAI: false,
      },
    });
    setEditingRule(null);
    setShowCreateForm(false);
  };

  const addCondition = () => {
    setFormData((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          type: "keyword" as const,
          operator: "contains",
          value: "",
          caseSensitive: false,
        },
      ],
    }));
  };

  const removeCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      ),
    }));
  };

  if (loading) {
    return <div className="p-6">Loading rules...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-2xl shadow-md border mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Response Rules
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Configure automated responses based on conditions
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create Rule
              </button>
              <a
                href="/dashboard"
                className="px-4 py-2 bg-white text-gray-700 border rounded-md hover:bg-gray-50"
              >
                Back to Dashboard
              </a>
            </div>
          </div>

          {message && (
            <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md">
              {message}
            </div>
          )}

          {/* Rules List */}
          <div className="space-y-4">
            {rules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No rules configured. Create your first rule to get started.
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule._id}
                  className={`border rounded-lg p-4 ${
                    rule.enabled
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {rule.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            rule.enabled
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {rule.enabled ? "Enabled" : "Disabled"}
                        </span>
                        <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
                          Priority: {rule.priority}
                        </span>
                      </div>

                      {rule.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {rule.description}
                        </p>
                      )}

                      <div className="text-sm text-gray-500 mb-2">
                        <strong>Conditions:</strong> {rule.conditions.length}{" "}
                        condition(s)
                      </div>

                      <div className="text-sm text-gray-500">
                        <strong>Response:</strong>{" "}
                        {rule.response.type === "text"
                          ? "Text"
                          : rule.response.type === "ai"
                          ? "AI Generated"
                          : "No Response"}
                        {rule.response.useAI && " + AI"}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(rule._id)}
                        className={`px-3 py-1 text-sm rounded ${
                          rule.enabled
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {rule.enabled ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleEdit(rule)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(rule._id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Create/Edit Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">
                {editingRule ? "Edit Rule" : "Create New Rule"}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-md"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority (1-100)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          priority: parseInt(e.target.value),
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.enabled ? "enabled" : "disabled"}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          enabled: e.target.value === "enabled",
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="enabled">Enabled</option>
                      <option value="disabled">Disabled</option>
                    </select>
                  </div>
                </div>

                {/* Conditions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Conditions *
                    </label>
                    <button
                      type="button"
                      onClick={addCondition}
                      className="text-sm bg-indigo-100 text-indigo-700 px-2 py-1 rounded"
                    >
                      Add Condition
                    </button>
                  </div>

                  {formData.conditions.map((condition, index) => (
                    <div key={index} className="border p-3 rounded mb-2">
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <select
                          value={condition.type}
                          onChange={(e) =>
                            updateCondition(index, "type", e.target.value)
                          }
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="keyword">Keyword</option>
                          <option value="time">Time</option>
                          <option value="contact">Contact</option>
                          <option value="message_type">Message Type</option>
                        </select>

                        <select
                          value={condition.operator}
                          onChange={(e) =>
                            updateCondition(index, "operator", e.target.value)
                          }
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="contains">Contains</option>
                          <option value="equals">Equals</option>
                          <option value="starts_with">Starts With</option>
                          <option value="ends_with">Ends With</option>
                          {condition.type === "time" && (
                            <option value="between">Between</option>
                          )}
                        </select>

                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={
                              Array.isArray(condition.value)
                                ? condition.value.join(", ")
                                : condition.value
                            }
                            onChange={(e) => {
                              const val =
                                condition.type === "keyword"
                                  ? e.target.value
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter((s) => s)
                                  : e.target.value;
                              updateCondition(index, "value", val);
                            }}
                            placeholder={
                              condition.type === "keyword"
                                ? "keyword1, keyword2"
                                : "value"
                            }
                            className="flex-1 px-2 py-1 border rounded text-sm"
                          />
                          {formData.conditions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCondition(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>

                      {condition.type === "keyword" && (
                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={condition.caseSensitive || false}
                            onChange={(e) =>
                              updateCondition(
                                index,
                                "caseSensitive",
                                e.target.checked
                              )
                            }
                            className="mr-1"
                          />
                          Case sensitive
                        </label>
                      )}
                    </div>
                  ))}
                </div>

                {/* Response */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Response *
                  </label>

                  <div className="space-y-3">
                    <select
                      value={formData.response.type}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          response: {
                            ...prev.response,
                            type: e.target.value as "text" | "ai" | "none",
                          },
                        }))
                      }
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="text">Text Response</option>
                      <option value="ai">AI Generated</option>
                      <option value="none">No Response</option>
                    </select>

                    {formData.response.type === "text" && (
                      <>
                        <textarea
                          value={formData.response.content || ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              response: {
                                ...prev.response,
                                content: e.target.value,
                              },
                            }))
                          }
                          placeholder="Enter your response text..."
                          className="w-full px-3 py-2 border rounded-md"
                          rows={3}
                          required
                        />

                        <label className="flex items-center text-sm">
                          <input
                            type="checkbox"
                            checked={formData.response.useAI || false}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                response: {
                                  ...prev.response,
                                  useAI: e.target.checked,
                                },
                              }))
                            }
                            className="mr-2"
                          />
                          Also use AI for additional response
                        </label>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    {editingRule ? "Update Rule" : "Create Rule"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RulesManagement;
