# ### install node
# FROM node:12.18.1
# ENV NODE_ENV=production
# WORKDIR /src
# COPY ["package.json", "package-lock.json*", "./"]
# # RUN npm install
# CMD npm install

# # import miniconda and install environment
# FROM continuumio/miniconda3
# ADD environment.yml /tmp/environment.yml
# RUN conda env create -f /tmp/environment.yml
# # Pull the environment name out of the environment.yml
# RUN echo "source activate $(head -1 /tmp/environment.yml | cut -d' ' -f2)" > ~/.bashrc
# ENV PATH /opt/conda/envs/$(head -1 /tmp/environment.yml | cut -d' ' -f2)/bin:$PATH

# RUN ls -l
# COPY . app
# RUN ls -l
# WORKDIR /app
# # ENTRYPOINT /bin/bash
# # RUN ls -l
# # WORKDIR /app/app
# # RUN ls -l
# # RUN python ap_parser.py ../protocol.json
# # CMD conda activate human
# CMD ["/bin/bash", "flask run --host=0.0.0.0"]



FROM continuumio/miniconda3

WORKDIR /src

# Create the environment:
COPY environment.yml .
RUN conda env create -f environment.yml

# Make RUN commands use the new environment:
SHELL ["conda", "run", "-n", "human", "/bin/bash", "-c"]

# Make sure the environment is activated:
RUN echo "Make sure flask is installed:"
RUN python -c "import flask"

# The code to run when container is started:
# COPY run.py .
COPY . app
WORKDIR app

ENTRYPOINT ["conda", "run", "--no-capture-output", "-n", "human", "flask", "run", "--host=0.0.0.0"]
