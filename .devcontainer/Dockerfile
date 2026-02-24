FROM debian:bookworm-slim

# 1. System dependencies, Locales, and Python
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl git zip ca-certificates build-essential sudo \
    bash-completion locales python3 python3-pip python3-venv \
    && sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen \
    && locale-gen \
    && rm -rf /var/lib/apt/lists/*

ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# 2. Install Node.js 22
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/*

# 3. user setup
ARG USERNAME=user
RUN groupadd --gid 1000 $USERNAME \
    && useradd --uid 1000 --gid 1000 -m -s /bin/bash $USERNAME \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME

ENV PATH="/home/user/.local/bin:${PATH}"

USER $USERNAME
ENV HOME=/home/$USERNAME
WORKDIR /workspaces/viernulvier-3
