import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Bell, BellOff, Check, CheckCheck, Plus, Settings, Trash2, X } from "lucide-react";
import type { Alert, AlertRule, AlertMetric, AlertOperator, AlertSeverity } from "../../shared/contracts";
import {
  listAlerts,
  listAlertRules,
  markAlertAsRead,
  markAllAlertsAsRead,
  createAlertRule,
  toggleAlertRule,
  deleteAlertRule,
  checkAlertRules,
} from "../../services/apiClient";

type Props = {
  competitors: string[];
  onUnreadChange?: (count: number) => void;
};

export function AlertsPanel({ competitors, onUnreadChange }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"alerts" | "rules">("alerts");
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [checking, setChecking] = useState(false);

  const [newRule, setNewRule] = useState({
    name: "",
    competitor: "any",
    metric: "growth" as AlertMetric,
    operator: "gt" as AlertOperator,
    threshold: 10,
    severity: "medium" as AlertSeverity,
  });

  const fetchData = useCallback(async () => {
    try {
      const [alertsData, rulesData] = await Promise.all([listAlerts(), listAlertRules()]);
      setAlerts(alertsData);
      setRules(rulesData);
    } catch (err) {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Keep the parent's notification badge in sync with this panel's state.
  useEffect(() => {
    onUnreadChange?.(alerts.filter((a) => !a.isRead).length);
  }, [alerts, onUnreadChange]);

  const handleMarkRead = async (id: string) => {
    await markAlertAsRead(id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)));
  };

  const handleMarkAllRead = async () => {
    await markAllAlertsAsRead();
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
    toast.success("All alerts marked as read");
  };

  const handleCheckRules = async () => {
    setChecking(true);
    try {
      const result = await checkAlertRules();
      if (result.count > 0) {
        toast.success(`${result.count} new alert(s) triggered`);
        setAlerts((prev) => [...result.alerts, ...prev]);
      } else {
        toast.message("No alerts triggered", { description: "All metrics within thresholds" });
      }
    } catch (err) {
      toast.error("Failed to check rules");
    } finally {
      setChecking(false);
    }
  };

  const handleCreateRule = async () => {
    if (!newRule.name.trim()) {
      toast.error("Rule name is required");
      return;
    }
    try {
      const rule = await createAlertRule(newRule);
      setRules((prev) => [rule, ...prev]);
      setShowCreateRule(false);
      setNewRule({
        name: "",
        competitor: "any",
        metric: "growth",
        operator: "gt",
        threshold: 10,
        severity: "medium",
      });
      toast.success("Alert rule created");
    } catch (err) {
      toast.error("Failed to create rule");
    }
  };

  const handleToggleRule = async (id: string, isEnabled: boolean) => {
    await toggleAlertRule(id, isEnabled);
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, isEnabled } : r)));
  };

  const handleDeleteRule = async (id: string) => {
    await deleteAlertRule(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast.success("Rule deleted");
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return "severity-critical";
      case "high":
        return "severity-high";
      case "medium":
        return "severity-medium";
      case "low":
        return "severity-low";
      default:
        return "";
    }
  };

  const getOperatorLabel = (op: AlertOperator) => {
    switch (op) {
      case "gt":
        return ">";
      case "lt":
        return "<";
      case "eq":
        return "=";
      case "gte":
        return ">=";
      case "lte":
        return "<=";
      default:
        return op;
    }
  };

  if (loading) {
    return (
      <div className="alerts-panel card">
        <div className="loading-spinner">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="alerts-panel">
      <div className="alerts-header">
        <div className="alerts-tabs">
          <button
            type="button"
            className={activeTab === "alerts" ? "active" : ""}
            onClick={() => setActiveTab("alerts")}
          >
            <Bell size={16} />
            Alerts
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          <button
            type="button"
            className={activeTab === "rules" ? "active" : ""}
            onClick={() => setActiveTab("rules")}
          >
            <Settings size={16} />
            Rules
            <span className="badge">{rules.length}</span>
          </button>
        </div>
        <div className="alerts-actions">
          {activeTab === "alerts" ? (
            <>
              <button type="button" onClick={handleCheckRules} disabled={checking} className="btn-secondary">
                {checking ? "Checking..." : "Check Now"}
              </button>
              {unreadCount > 0 && (
                <button type="button" onClick={handleMarkAllRead} className="btn-ghost">
                  <CheckCheck size={16} />
                  Mark all read
                </button>
              )}
            </>
          ) : (
            <button type="button" onClick={() => setShowCreateRule(true)} className="btn-primary">
              <Plus size={16} />
              New Rule
            </button>
          )}
        </div>
      </div>

      {activeTab === "alerts" && (
        <div className="alerts-list">
          {alerts.length === 0 ? (
            <div className="empty-state">
              <BellOff size={48} />
              <h3>No alerts yet</h3>
              <p>Create alert rules to monitor competitor metrics and get notified of changes.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`alert-item ${alert.isRead ? "read" : "unread"}`}>
                <div className={`alert-severity ${getSeverityColor(alert.severity)}`}>
                  <AlertTriangle size={16} />
                </div>
                <div className="alert-content">
                  <div className="alert-meta">
                    <span className="competitor">{alert.competitor}</span>
                    <span className="metric">{alert.metric}</span>
                    <span className={`severity-badge ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="alert-message">{alert.message}</p>
                  <span className="alert-time">
                    {new Date(alert.triggeredAt).toLocaleString()}
                  </span>
                </div>
                {!alert.isRead && (
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleMarkRead(alert.id)}
                    title="Mark as read"
                  >
                    <Check size={16} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "rules" && (
        <div className="rules-list">
          {showCreateRule && (
            <div className="create-rule-form card">
              <div className="form-header">
                <h3>Create Alert Rule</h3>
                <button type="button" className="btn-icon" onClick={() => setShowCreateRule(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="rule-name">Rule Name</label>
                  <input
                    id="rule-name"
                    type="text"
                    value={newRule.name}
                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                    placeholder="e.g., High growth alert"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rule-competitor">Competitor</label>
                  <select
                    id="rule-competitor"
                    value={newRule.competitor}
                    onChange={(e) => setNewRule({ ...newRule, competitor: e.target.value })}
                  >
                    <option value="any">Any competitor</option>
                    {competitors.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="rule-metric">Metric</label>
                  <select
                    id="rule-metric"
                    value={newRule.metric}
                    onChange={(e) => setNewRule({ ...newRule, metric: e.target.value as AlertMetric })}
                  >
                    <option value="growth">Growth</option>
                    <option value="marketShare">Market Share</option>
                    <option value="sentiment">Sentiment</option>
                    <option value="engagement">Engagement</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="rule-operator">Condition</label>
                  <select
                    id="rule-operator"
                    value={newRule.operator}
                    onChange={(e) => setNewRule({ ...newRule, operator: e.target.value as AlertOperator })}
                  >
                    <option value="gt">Greater than</option>
                    <option value="gte">Greater than or equal</option>
                    <option value="lt">Less than</option>
                    <option value="lte">Less than or equal</option>
                    <option value="eq">Equal to</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="rule-threshold">Threshold</label>
                  <input
                    id="rule-threshold"
                    type="number"
                    value={newRule.threshold}
                    onChange={(e) => setNewRule({ ...newRule, threshold: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rule-severity">Severity</label>
                  <select
                    id="rule-severity"
                    value={newRule.severity}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as AlertSeverity })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-ghost" onClick={() => setShowCreateRule(false)}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={handleCreateRule}>
                  Create Rule
                </button>
              </div>
            </div>
          )}

          {rules.length === 0 && !showCreateRule ? (
            <div className="empty-state">
              <Settings size={48} />
              <h3>No alert rules</h3>
              <p>Create rules to automatically monitor competitor metrics.</p>
              <button type="button" className="btn-primary" onClick={() => setShowCreateRule(true)}>
                <Plus size={16} />
                Create First Rule
              </button>
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className={`rule-item ${rule.isEnabled ? "" : "disabled"}`}>
                <div className="rule-info">
                  <h4>{rule.name}</h4>
                  <p className="rule-condition">
                    <span className="competitor">{rule.competitor}</span>
                    <span className="metric">{rule.metric}</span>
                    <span className="operator">{getOperatorLabel(rule.operator)}</span>
                    <span className="threshold">{rule.threshold}</span>
                  </p>
                  <span className={`severity-badge ${getSeverityColor(rule.severity)}`}>
                    {rule.severity}
                  </span>
                </div>
                <div className="rule-actions">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={rule.isEnabled}
                      onChange={(e) => handleToggleRule(rule.id, e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                  <button
                    type="button"
                    className="btn-icon danger"
                    onClick={() => handleDeleteRule(rule.id)}
                    title="Delete rule"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
