import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Form,
  Input,
  Layout,
  List,
  Menu,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  FolderOutlined,
  LogoutOutlined,
  PlusOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { api, ApiRequestError } from '../api';
import { getStatusTagStyle } from '../status';
import { colors } from '../theme';
import type { Comment, Issue, IssueStatus, Project, User, UserRole } from '../types';

const { Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

type View = 'projects' | 'team';

const STATUS_OPTIONS: { value: IssueStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

function StatusTag({ status }: { status: IssueStatus }) {
  const style = getStatusTagStyle(status);
  return (
    <Tag
      className="status-tag"
      style={{
        color: style.color,
        background: style.background,
        borderColor: style.border,
      }}
    >
      {status.replace('_', ' ')}
    </Tag>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('projects');
  const [assignableUsers, setAssignableUsers] = useState<Pick<User, 'id' | 'name' | 'email'>[]>([]);
  const [teamUsers, setTeamUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [statusFilter, setStatusFilter] = useState<IssueStatus | ''>('');
  const [loading, setLoading] = useState(true);

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm] = Form.useForm();

  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [issueForm] = Form.useForm();

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileForm] = Form.useForm();

  const isAdmin = currentUser?.role === 'admin';
  const userMap = Object.fromEntries(
    [...assignableUsers, ...teamUsers].map((u) => [u.id, u]),
  );

  const showMsg = (type: 'success' | 'error', text: string) => {
    messageApi[type](text);
  };

  const loadTeamUsers = useCallback(async () => {
    if (!isAdmin) return;
    setTeamUsers(await api.getAllUsers());
  }, [isAdmin]);

  const loadIssues = useCallback(
    async (projectId: string, status?: IssueStatus | '') => {
      setIssues(
        await api.getIssues({
          projectId,
          ...(status ? { status } : {}),
        }),
      );
    },
    [],
  );

  useEffect(() => {
    if (!localStorage.getItem('trackflow_token')) {
      navigate('/auth');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const me = await api.getMe();
        if (cancelled) return;

        setCurrentUser(me);
        localStorage.setItem('trackflow_user', JSON.stringify(me));

        const [projectList, assignable] = await Promise.all([
          api.getProjects(),
          api.getAssignableUsers(),
        ]);
        if (cancelled) return;

        setProjects(projectList);
        setAssignableUsers(assignable);

        if (me.role === 'admin') {
          setTeamUsers(await api.getAllUsers());
        }

        const saved = localStorage.getItem('trackflow_selected_project');
        if (saved) {
          const parsed: Project = JSON.parse(saved);
          const found = projectList.find((p) => p.id === parsed.id);
          if (found) setSelectedProject(found);
        }
      } catch (err) {
        if (!cancelled && err instanceof ApiRequestError && err.statusCode === 401) {
          navigate('/auth');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (selectedProject) {
      loadIssues(selectedProject.id, statusFilter);
      setSelectedIssue(null);
      localStorage.setItem('trackflow_selected_project', JSON.stringify(selectedProject));
    }
  }, [selectedProject, statusFilter, loadIssues]);

  useEffect(() => {
    if (selectedIssue) loadComments(selectedIssue.id);
    else setComments([]);
  }, [selectedIssue]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const loadComments = async (issueId: string) => {
    setLoadingComments(true);
    try {
      setComments(await api.getComments(issueId));
    } finally {
      setLoadingComments(false);
    }
  };

  const canModifyProject = (project: Project) =>
    isAdmin || project.ownerId === currentUser?.id;

  const canUpdateIssue = (issue: Issue) => {
    if (!selectedProject || !currentUser) return false;
    return (
      isAdmin ||
      selectedProject.ownerId === currentUser.id ||
      issue.assigneeId === currentUser.id
    );
  };

  const canEditIssueAssignee = () => {
    if (!selectedProject || !currentUser) return false;
    return isAdmin || selectedProject.ownerId === currentUser.id;
  };

  const openIssueCreate = () => {
    setEditingIssue(null);
    issueForm.resetFields();
    setIssueModalOpen(true);
  };

  const openIssueEdit = (issue: Issue) => {
    setEditingIssue(issue);
    issueForm.setFieldsValue({
      title: issue.title,
      description: issue.description ?? '',
      status: issue.status,
      assigneeId: issue.assigneeId ?? undefined,
    });
    setIssueModalOpen(true);
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    try {
      await api.updateUserRole(userId, role);
      await loadTeamUsers();
      showMsg('success', `Role updated to ${role}`);
    } catch (err) {
      showMsg('error', err instanceof ApiRequestError ? err.message : 'Failed');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.deleteUser(userId);
      setTeamUsers((prev) => prev.filter((u) => u.id !== userId));
      showMsg('success', 'User deleted');
    } catch (err) {
      showMsg('error', err instanceof ApiRequestError ? err.message : 'Failed');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  const openProjectModal = (project?: Project) => {
    setEditingProject(project ?? null);
    projectForm.setFieldsValue({
      name: project?.name ?? '',
      description: project?.description ?? '',
    });
    setProjectModalOpen(true);
  };

  const navItems: MenuProps['items'] = [
    {
      key: 'projects',
      icon: <FolderOutlined />,
      label: 'Projects',
    },
    ...(isAdmin
      ? [
          {
            key: 'team',
            icon: <TeamOutlined />,
            label: 'Team',
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <div className="loading-screen">
        <Spin size="large" tip="Loading TrackFlow…" />
      </div>
    );
  }

  return (
    <Layout className="dashboard-layout">
      {contextHolder}

      <Sider width={280} className="dashboard-sider" theme="dark" collapsedWidth={0}>
        <div className="sider-inner">
          <div className="sidebar-brand">
            <div className="brand-mark" aria-hidden />
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-title">TrackFlow</span>
              <span className="sidebar-brand-subtitle">Bug Tracker</span>
            </div>
          </div>

          {currentUser && (
            <div className={`role-banner role-${currentUser.role}`}>
              <Text strong className="role-label">
                {currentUser.role === 'admin' ? 'Administrator' : 'Team member'}
              </Text>
              <Text type="secondary" className="role-desc">
                {currentUser.role === 'admin'
                  ? 'See all projects & manage users'
                  : 'Your projects & assigned issues only'}
              </Text>
            </div>
          )}

          <div className="sidebar-nav-block">
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[view]}
              items={navItems}
              onClick={({ key }) => setView(key as View)}
              style={{ border: 'none' }}
            />
          </div>

          <div className="sidebar-projects">
            <div className="sidebar-section-head">
              <Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                YOUR PROJECTS
              </Text>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                className="sidebar-add-project-btn"
                onClick={() => openProjectModal()}
              >
                New
              </Button>
            </div>
            <div className="sidebar-projects-scroll">
              {projects.length === 0 ? (
                <Text type="secondary" style={{ fontSize: 12, padding: '0 8px' }}>
                  No projects yet.
                </Text>
              ) : (
                <ul className="project-list">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={`project-list-item${
                          selectedProject?.id === p.id ? ' active' : ''
                        }`}
                        onClick={() => {
                          setView('projects');
                          setSelectedProject(p);
                        }}
                      >
                        <span className="project-list-name">{p.name}</span>
                        {isAdmin && p.ownerId !== currentUser?.id && (
                          <span className="project-list-meta">
                            {userMap[p.ownerId]?.name ?? 'Other owner'}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="sidebar-footer">
            {currentUser && (
              <Button
                type="text"
                block
                className="user-chip-btn"
                onClick={() => {
                  profileForm.setFieldsValue({ name: currentUser.name });
                  setProfileModalOpen(true);
                }}
              >
                <Space>
                  <Avatar style={{ background: colors.primary }}>
                    {currentUser.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <div style={{ textAlign: 'left', minWidth: 0 }}>
                    <div>
                      <Text strong>{currentUser.name}</Text>
                    </div>
                    <Text style={{ fontSize: 11 }} ellipsis>
                      {currentUser.email}
                    </Text>
                  </div>
                </Space>
              </Button>
            )}
            <Button
              block
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </div>
        </div>
      </Sider>

      <Layout>
        {view === 'team' && isAdmin ? (
          <Content className="main-content">
            <div className="team-section">
            <div className="page-header">
              <Title level={3}>Team management</Title>
              <Paragraph type="secondary" style={{ marginTop: 4 }}>
                List all users, change roles, and delete accounts.
              </Paragraph>
            </div>
            <Table
              rowKey="id"
              dataSource={teamUsers}
              pagination={false}
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                {
                  title: 'Role',
                  key: 'role',
                  render: (_, u) => (
                    <Select
                      value={u.role}
                      disabled={u.id === currentUser?.id}
                      style={{ width: 120 }}
                      options={[
                        { value: 'user', label: 'User' },
                        { value: 'admin', label: 'Admin' },
                      ]}
                      onChange={(role) => handleRoleChange(u.id, role as UserRole)}
                    />
                  ),
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (_, u) =>
                    u.id === currentUser?.id ? (
                      <Text type="secondary">You</Text>
                    ) : (
                      <Popconfirm
                        title={`Delete ${u.name}?`}
                        description="This cannot be undone."
                        okText="Delete"
                        okButtonProps={{ danger: true }}
                        onConfirm={() => handleDeleteUser(u.id)}
                      >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                          Delete
                        </Button>
                      </Popconfirm>
                    ),
                },
              ]}
            />
            </div>
          </Content>
        ) : (
          <Layout className="main-split">
            <Content className="main-content">
              {selectedProject ? (
                <>
                  <div className="project-header">
                    <div>
                      <Title level={3} style={{ margin: 0 }}>
                        {selectedProject.name}
                      </Title>
                      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                        {selectedProject.description || 'No description.'}
                        {isAdmin && (
                          <>
                            {' '}
                            · Owner:{' '}
                            {userMap[selectedProject.ownerId]?.name ??
                              selectedProject.ownerId}
                          </>
                        )}
                      </Paragraph>
                    </div>
                    {canModifyProject(selectedProject) && (
                      <Space>
                        <Button
                          icon={<EditOutlined />}
                          onClick={() => openProjectModal(selectedProject)}
                        >
                          Edit
                        </Button>
                        <Popconfirm
                          title="Delete this project?"
                          description="All issues in this project will be removed."
                          okText="Delete"
                          okButtonProps={{ danger: true }}
                          onConfirm={async () => {
                            try {
                              await api.deleteProject(selectedProject.id);
                              setProjects(projects.filter((p) => p.id !== selectedProject.id));
                              setSelectedProject(null);
                              showMsg('success', 'Project deleted');
                            } catch (err) {
                              showMsg(
                                'error',
                                err instanceof ApiRequestError ? err.message : 'Failed',
                              );
                            }
                          }}
                        >
                          <Button danger icon={<DeleteOutlined />}>
                            Delete
                          </Button>
                        </Popconfirm>
                      </Space>
                    )}
                  </div>

                  <div className="issues-toolbar">
                    <Space>
                      <Title level={5} style={{ margin: 0 }}>
                        Issues
                      </Title>
                      <Badge count={issues.length} showZero color={colors.primary} />
                    </Space>
                    <Space wrap>
                      <Select
                        allowClear
                        placeholder="All statuses"
                        style={{ minWidth: 160 }}
                        value={statusFilter || undefined}
                        onChange={(v) => setStatusFilter((v as IssueStatus) ?? '')}
                        options={STATUS_OPTIONS}
                      />
                      {canModifyProject(selectedProject) && (
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={openIssueCreate}
                        >
                          New issue
                        </Button>
                      )}
                    </Space>
                  </div>

                  {issues.length === 0 ? (
                    <Empty description="No issues in this project" />
                  ) : (
                    <div className="issue-list">
                      {issues.map((issue) => {
                        const assignee = issue.assigneeId
                          ? userMap[issue.assigneeId]
                          : null;
                        const active = selectedIssue?.id === issue.id;
                        return (
                          <Card
                            key={issue.id}
                            size="small"
                            className={`issue-card ${active ? 'active' : ''}`}
                            onClick={() => setSelectedIssue(issue)}
                          >
                            <div className="issue-card-top">
                              <Text strong>{issue.title}</Text>
                              <Space onClick={(e) => e.stopPropagation()}>
                                <Select
                                  size="small"
                                  value={issue.status}
                                  style={{ width: 130 }}
                                  disabled={!canUpdateIssue(issue)}
                                  options={STATUS_OPTIONS}
                                  onChange={(status) =>
                                    api
                                      .updateIssue(issue.id, {
                                        status: status as IssueStatus,
                                      })
                                      .then((u) => {
                                        setIssues(
                                          issues.map((i) => (i.id === u.id ? u : i)),
                                        );
                                        if (selectedIssue?.id === u.id) setSelectedIssue(u);
                                      })
                                      .catch((err) =>
                                        showMsg(
                                          'error',
                                          err instanceof ApiRequestError
                                            ? err.message
                                            : 'Failed',
                                        ),
                                      )
                                  }
                                />
                                {canUpdateIssue(issue) && (
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<EditOutlined />}
                                    onClick={() => openIssueEdit(issue)}
                                  />
                                )}
                                {canModifyProject(selectedProject) && (
                                  <Popconfirm
                                    title="Delete this issue?"
                                    okText="Delete"
                                    okButtonProps={{ danger: true }}
                                    onConfirm={async () => {
                                      await api.deleteIssue(issue.id);
                                      setIssues(issues.filter((i) => i.id !== issue.id));
                                      if (selectedIssue?.id === issue.id) setSelectedIssue(null);
                                      showMsg('success', 'Issue deleted');
                                    }}
                                  >
                                    <Button
                                      type="text"
                                      danger
                                      size="small"
                                      icon={<DeleteOutlined />}
                                    />
                                  </Popconfirm>
                                )}
                              </Space>
                            </div>
                            {issue.description && (
                              <Paragraph
                                type="secondary"
                                style={{ margin: '8px 0', fontSize: 13 }}
                                ellipsis={{ rows: 2 }}
                              >
                                {issue.description}
                              </Paragraph>
                            )}
                            <Space size="small">
                              <StatusTag status={issue.status} />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {assignee ? `Assigned: ${assignee.name}` : 'Unassigned'}
                              </Text>
                            </Space>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      <Title level={4}>Select a project</Title>
                      <Text type="secondary">
                        {isAdmin
                          ? 'You can see every project on the platform.'
                          : 'You only see projects you created.'}
                      </Text>
                    </span>
                  }
                />
              )}
            </Content>

          </Layout>
        )}
      </Layout>

      <Modal
        title={editingProject ? 'Edit project' : 'New project'}
        open={projectModalOpen}
        onCancel={() => setProjectModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={projectForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              if (editingProject) {
                const u = await api.updateProject(editingProject.id, values);
                setProjects(projects.map((p) => (p.id === u.id ? u : p)));
                if (selectedProject?.id === u.id) setSelectedProject(u);
                showMsg('success', 'Project saved');
              } else {
                const c = await api.createProject(values);
                setProjects([c, ...projects]);
                setSelectedProject(c);
                setView('projects');
                showMsg('success', 'Project created');
              }
              setProjectModalOpen(false);
            } catch (err) {
              showMsg('error', err instanceof ApiRequestError ? err.message : 'Failed');
            }
          }}
        >
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Project name" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Optional description" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Save
          </Button>
        </Form>
      </Modal>

      <Drawer
        title={selectedIssue?.title}
        placement="right"
        width={440}
        open={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        destroyOnClose
        extra={
          selectedIssue && canUpdateIssue(selectedIssue) ? (
            <Button
              icon={<EditOutlined />}
              onClick={() => openIssueEdit(selectedIssue)}
            >
              Edit
            </Button>
          ) : null
        }
        footer={
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!selectedIssue || !newComment.trim()) return;
              setPostingComment(true);
              try {
                const c = await api.createComment(selectedIssue.id, newComment);
                setComments([...comments, c]);
                setNewComment('');
              } finally {
                setPostingComment(false);
              }
            }}
          >
            <TextArea
              rows={2}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment…"
              style={{ marginBottom: 8 }}
            />
            <Button type="primary" htmlType="submit" block loading={postingComment}>
              Post comment
            </Button>
          </form>
        }
      >
        {selectedIssue && (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Status">
                <StatusTag status={selectedIssue.status} />
              </Descriptions.Item>
              <Descriptions.Item label="Assignee">
                {selectedIssue.assigneeId
                  ? userMap[selectedIssue.assigneeId]?.name ?? 'Unknown'
                  : 'Unassigned'}
              </Descriptions.Item>
              {selectedIssue.description && (
                <Descriptions.Item label="Description">
                  {selectedIssue.description}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider titlePlacement="start" style={{ margin: '20px 0 12px' }}>
              Comments
            </Divider>

            <List
              className="drawer-comments-list"
              loading={loadingComments}
              dataSource={comments}
              locale={{ emptyText: 'No comments yet' }}
              renderItem={(c) => {
                const canDeleteComment =
                  c.authorId === currentUser?.id ||
                  isAdmin ||
                  (selectedProject && canModifyProject(selectedProject));

                return (
                  <List.Item
                    actions={
                      canDeleteComment
                        ? [
                            <Popconfirm
                              key="delete"
                              title="Delete comment?"
                              onConfirm={async () => {
                                await api.deleteComment(c.id);
                                setComments(comments.filter((x) => x.id !== c.id));
                              }}
                            >
                              <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                            </Popconfirm>,
                          ]
                        : undefined
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ background: colors.primary }}>
                          {c.author.name.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      title={c.author.name}
                      description={c.content}
                    />
                  </List.Item>
                );
              }}
            />
            <div ref={commentsEndRef} />
          </>
        )}
      </Drawer>

      <Modal
        title={editingIssue ? 'Edit issue' : 'New issue'}
        open={issueModalOpen}
        onCancel={() => {
          setIssueModalOpen(false);
          setEditingIssue(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={issueForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!selectedProject) return;
            try {
              if (editingIssue) {
                const payload: Parameters<typeof api.updateIssue>[1] = {
                  title: values.title,
                  description: values.description,
                  status: values.status,
                };
                if (canEditIssueAssignee()) {
                  payload.assigneeId = values.assigneeId ?? undefined;
                }
                const u = await api.updateIssue(editingIssue.id, payload);
                setIssues(issues.map((i) => (i.id === u.id ? u : i)));
                if (selectedIssue?.id === u.id) setSelectedIssue(u);
                showMsg('success', 'Issue updated');
              } else {
                const c = await api.createIssue({
                  title: values.title,
                  description: values.description,
                  projectId: selectedProject.id,
                  ...(values.assigneeId ? { assigneeId: values.assigneeId } : {}),
                });
                setIssues([c, ...issues]);
                showMsg('success', 'Issue created');
              }
              setIssueModalOpen(false);
              setEditingIssue(null);
            } catch (err) {
              showMsg('error', err instanceof ApiRequestError ? err.message : 'Failed');
            }
          }}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input placeholder="Issue title" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          {editingIssue && (
            <Form.Item name="status" label="Status" rules={[{ required: true }]}>
              <Select options={STATUS_OPTIONS} />
            </Form.Item>
          )}
          <Form.Item name="assigneeId" label="Assignee">
            <Select
              allowClear
              placeholder="Unassigned"
              showSearch
              optionFilterProp="label"
              disabled={!!editingIssue && !canEditIssueAssignee()}
              options={assignableUsers.map((u) => ({
                value: u.id,
                label: `${u.name} (${u.email})`,
              }))}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            {editingIssue ? 'Save changes' : 'Create issue'}
          </Button>
        </Form>
      </Modal>

      <Modal
        title="Profile"
        open={profileModalOpen}
        onCancel={() => setProfileModalOpen(false)}
        footer={null}
      >
        <Paragraph type="secondary">
          Role:{' '}
          <Tag
            style={
              currentUser?.role === 'admin'
                ? { color: '#B45309', background: '#FFFBEB', borderColor: '#FDE68A' }
                : { color: colors.primary, background: '#EFF6FF', borderColor: '#BFDBFE' }
            }
          >
            {currentUser?.role}
          </Tag>
          — only an admin can change roles.
        </Paragraph>
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={async (values) => {
            const u = await api.updateProfile({ name: values.name });
            setCurrentUser(u);
            localStorage.setItem('trackflow_user', JSON.stringify(u));
            setProfileModalOpen(false);
            showMsg('success', 'Profile updated');
          }}
        >
          <Form.Item name="name" label="Display name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Save
          </Button>
        </Form>
      </Modal>
    </Layout>
  );
}
